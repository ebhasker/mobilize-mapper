const [MobilizeMapperApp, runMobilizeMapperAppTests] = (function() {
    const perPageValues = [10, 25, 100];
    
    // convenient short-hand for defining elements
    const e = React.createElement;

    function init(flags) {
        return {
            organizationId: flags.organizationId,
            events: {
                loaded: false,
                error: null,
                page: 1,
                perPage: perPageValues[0],
                pageCount: 0,
                info: null
            }
        };
    }

    function update(state, action) {
        switch(action.type) {
            case "setEventsData":
                return {
                    ...state,
                    events: {
                        ...state.events,
                        loaded: true,
                        error: null,
                        page: action.page,
                        pageCount: Math.ceil(action.events.count / state.events.perPage),
                        info: action.events
                    }
                };
            case "setEventsError":
                return {
                    ...state,
                    events: {
                        ...state.events,
                        loaded: false,
                        error: action.error,
                        page: action.page,
                        pageCount: 0,
                        info: null
                    }
                };
            case "setEventsPage":
                return {
                    ...state,
                    events: {
                        ...state.events,
                        loaded: false,
                        error: null,
                        page: action.page,
                        info: null
                    }
                };
            default:
                console.error("unknown updateState action `" + action.type + "`");
                return state;
        }
    }

    function mobilizeV1Api(action) {
        const entryPoint = "https://api.mobilize.us";

        const endpoints = {
            listOrganizationEvents: ({organizationId}) => `/v1/organizations/${organizationId}/events`
        };

        const endpointHandler = endpoints[action.endpointName];
        if(endpointHandler === undefined) {
            return {"loaded": false, "error": "unknown endpoint", "info": null};
        }

        const query = "?" + action.requestParams.map(([param, value]) => `${param}=${value}`).join("&");

        const url = entryPoint + endpointHandler(action) + query;
        window.fetch(url)
            .then((res) => {
                //console.log(res); // debug
                return res.json();
            })
            .then((res) => {
                action.handleSuccess(res);
            })
            .catch((err) => {
                action.handleError("" + err);
            });
    }

    const computePageList = (currentPage, maxPage) => {
        const pageList = [];
        if(currentPage > 5) {
            pageList.push(1, null, currentPage - 2, currentPage - 1);
        }
        else {
            for(let k = 1; k < currentPage; k++) {
                pageList.push(k);
            }
        }

        pageList.push(currentPage);

        if(currentPage + 4 < maxPage) {
            pageList.push(currentPage + 1, currentPage + 2, null, maxPage);
        }
        else {
            for(let k = currentPage + 1; k <= maxPage; k++) {
                pageList.push(k);
            }
        }

        return pageList;
    }

    // abstract out our elements library
    const bulmaLayoutManager = {
        block: (...content) => e("div", {className: "block"}, ...content),
        box: (...content) => e("div", {className: "box"}, ...content),
        paragraph: (...content) => e("p", {}, ...content),
        card: ({title, imageSrc, imageHeight, content}) => e("div", {className: "card"},
            e("div", {className: "card-image"},
                imageSrc ? e("figure", {
                    className: "image",
                    style: imageHeight ? {maxHeight: imageHeight, overflow: "hidden"} : {}},
                    e("img", {src: imageSrc})
                ) : []
            ),
            e("header", {className: "card-header"},
                e("p", {className: "card-header-title"}, title)
            ),
            ...content
        ),
        title: (text) => e("h1", {className: "title is-4"}, text),
        message: ({title, content}) => e("article", {className: "message"},
            e("div", {className: "message-header"}, title),
            e("div", {className: "message-body"}, ...content)
        ),
        columns: (...content) => e("div", {className: "columns"}, ...content),
        column: ({classes, content}) =>
            e("div", {
                className: "column" + (classes? " " + classes.join(" ") : "")
            }, ...content),
        pagination: ({currentPage, unorderedLinks, orderedLinks}) =>
            e("nav", {className: "pagination is-small", "aria-label": "pagination"},
                ...unorderedLinks,
                e("ul", {className: "pagination-list"},
                    ...orderedLinks.map(
                        (link) => link === null ?
                            e("span", {className: "pagination-ellipsis"}, "\u2026"):
                            e("li", {}, link)
                    )
                )
            )
    };

    const layoutManagerContext = React.createContext(bulmaLayoutManager);

    const render = (ui) => e(layoutManagerContext.Consumer, {}, ui);

    function App(flags) {
        if(typeof React === "undefined") {
            console.error("Please include ReactJs scripts");
            return;
        }

        const api = mobilizeV1Api;

        const [state, dispatch] = React.useReducer(update, flags, init);

        const actions = {
            loadEvents: (page, events) => dispatch({
                type: "setEventsData",
                page: page,
                events: events
            }),
            loadEventsError: (page, error) => dispatch({
                type: "setEventsError",
                page: page,
                error: error
            }),
            setEventsPage: (page) => dispatch({
                type: "setEventsPage",
                page: page
            })
        }

        function fetchEvents() {
            api({
                endpointName: "listOrganizationEvents",
                organizationId: state.organizationId,
                requestParams: [
                    ["timeslot_end", "gte_now"],        // query for events at or after the current time
                    ["page", state.events.page],        // get the current page of results
                    ["per_page", state.events.perPage]  // use preference on results per page
                ],
                handleSuccess: (data) => actions.loadEvents(state.events.page, data),
                handleError: (data) => actions.loadEventsError(state.events.page, data),
            });
        }

        React.useEffect(() => {
            console.log("*** fetching events...");
            fetchEvents();
        }, [state.organizationId, state.events.page, state.events.perPage]);

        // Loading by default
        let eventListUi = e("p", {}, "Loading Events...");
        if(!state.events.loaded) {
            if(state.events.error !== null) {
                eventListUi = e("p", {}, `Error loading events: ${state.events.error}`);
            }
        }
        else {
            // no error, events loaded
            eventListUi = e(
                OrganizationEventList,
                {
                    info: state.events.info,
                    page: state.events.page,
                    perPage: state.events.perPage,
                    actions: actions
                }
            );
        }

        // finished loading events, initialize view
        const ui = ({box, block, columns, column, title}) => box(
            block(title("Mobilize Events")),
            block(
                PaginationView({
                    currentPage: state.events.page,
                    pageCount: state.events.pageCount,
                    enabled: state.events.loaded,
                    setPage: (page) => actions.setEventsPage(page)
                })
            ),
            columns(
                column({
                    classes: ["is-one-quarter"],
                    content: [eventListUi]
                }),
                column({
                    classes: ["is-three-quarters"],
                    content: [
                        block(title("Map")),
                    ]
                })
            )
        );

        return render(ui);
    };

    function PaginationView({currentPage, pageCount, enabled, setPage}) {
        const makeLink = (props, text) => e("a", {...props, disabled: !enabled}, text);

        const unorderedLinks = [];
        const prevProps = {className: "pagination-previous"};
        if(currentPage == 1) {
            prevProps.title = "This is the first page";
            prevProps.disabled = true;
        }
        else {
            prevProps.onClick = () => setPage(currentPage - 1);
        }
        unorderedLinks.push(makeLink(prevProps, "Previous"));

        const nextProps = {className: "pagination-next"};
        if(currentPage + 1 > pageCount) {
            nextProps.title = "This is the last page";
            nextProps.disabled = true;
        }
        else {
            nextProps.onClick = () => setPage(currentPage + 1);
        }
        unorderedLinks.push(makeLink(nextProps, "Next Page"));

        const listNums = computePageList(currentPage, pageCount);
        const orderedLinks = listNums.map(
            (num) => num == null ? null : makeLink(
                    {
                        className: "pagination-link" + (num == currentPage ? " is-current" : ""),
                        "aria-label": "Go to page " + num.toString(),
                        onClick: () => setPage(num)
                    },
                    num.toString()
                )
        );


        const ui = ({pagination}) => pagination({
            currentPage: currentPage,
            unorderedLinks: unorderedLinks,
            orderedLinks: orderedLinks,
            maxPage: pageCount,
            enabled: enabled,
            setPage: setPage
        });
        return render(ui);
    }

    // expects events returned from api
    function OrganizationEventList({info, actions}) {
        //  events has:
        //  - count (number of records total)
        //  - next: link to next if applicable, or null
        //  - previous: link to next if applicable, or null
        //  - data: the array of events
        //  - metadata: misc. stuff like build, etc. - doesn't seem too useful at the moment
        const ui = ({block}) => block(
            // debug: look at raw data
            //e("pre", {}, JSON.stringify(info, null, 2)),
            ...info.data.map((entry) => e(EventCard, {key: entry.id.toString(), entry: entry}))
        );

        return render(ui);
    }

    function EventCard({entry}) {
        // event has:
        //  - TBD
        const ui = ({card, message, paragraph}) => 
            card({
                title: entry.title,
                imageSrc: entry.featured_image_url,
                imageHeight: "15rem",
                content: [
                    message({
                        title: "Description",
                        content: (entry.summary? [paragraph(e("strong", {}, entry.summary)), paragraph(entry.description)] : [
                            paragraph(entry.description)
                        ])
                    }),
                    //e("pre", {}, JSON.stringify(entry, null, 2))
                ]
            });
        
        return render(ui);
    }

    function runTests() {
        if(typeof QUnit === "undefined") {
            console.error("Please include the QUnit scripts");
            return;
        }

        // parameterized testing
        QUnit.cases = function(cases) {
            return {
                test: function(name, callback) {
                    cases.forEach((params) => {
                        QUnit.test(name + "(" + JSON.stringify(params) + ")", (assert) => callback(params, assert))
                    });
                }
            }
        }
        
        QUnit.module('init', function() {
            QUnit.cases([1,33,1241].map((x) => ({organizationId: x})))
                .test('should result in correct state initialization', function(params, assert) {
                    state = init(params);
                    assert.equal(state.organizationId, params.organizationId);
                    assert.equal(state.events.loaded, false);
                });
        });
    }

    return [App, runTests];
})();
