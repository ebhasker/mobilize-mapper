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
                info: null
            }
        };
    }

    function update(state, action) {
        switch(action.type) {
            case "setEvents":
                return {...state, events: action.events};
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

    // abstract out our elements library
    const bulmaLayoutManager = {
        block: (...content) => e("div", {className: "block"}, ...content),
        box: (...content) => e("div", {className: "box"}, ...content),
        paragraph: (...content) => e("p", {}, ...content),
        card: ({title, imageSrc, content}) => e("div", {className: "card"},
            e("div", {className: "card-image"},
                e("figure", {className: "image"},
                    e("img", {src: imageSrc})
                )
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

        function loadEvents(events) {
            dispatch({
                type: "setEvents",
                events: {
                    loaded: true,
                    error: null,
                    info: events
                }
            });
        }

        function loadEventsError(error) {
            dispatch({
                type: "setEvents",
                events: {
                    loaded: false,
                    error: error,
                    info: {}
                }
            });
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
                handleSuccess: loadEvents,
                handleError: loadEventsError
            });
        }

        React.useEffect(() => {
            fetchEvents();
        }, [state.organizationId]);

        if(!state.events.loaded) {
            if(state.events.error !== null) {
                return e("p", {}, `Error loading events: ${state.events.error}`);
            }

            // no error, but still not loaded...
            return e("p", {}, "Loading Events...");
        }

        // finished loading events, initialize view
        const ui = ({block, box, title}) => box(
            block(title("Mobilize Events")),
            e(
                OrganizationEventList,
                {
                    info: state.events.info,
                    page: state.page,
                    perPage: state.perPage
                }
            )
        );

        return render(ui);
    };

    // expects events returned from api
    function OrganizationEventList({info, page, perPage}) {
        //  events has:
        //  - count (number of records total)
        //  - next: link to next if applicable, or null
        //  - previous: link to next if applicable, or null
        //  - data: the array of events
        //  - metadata: misc. stuff like build, etc. - doesn't seem too useful at the moment
        //const {block, box, title} = layoutManager;

        const ui = ({block}) => block(
            // debug: look at raw data
            //e("pre", {}, JSON.stringify(info, null, 2)),
            info.data.map((entry) => e(EventCard, {key: entry.id.toString(), entry: entry}))
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
                content: [
                    message({
                        title: "Description",
                        content: [paragraph(entry.description)]
                    }),
                    e("pre", {}, JSON.stringify(entry, null, 2))
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
