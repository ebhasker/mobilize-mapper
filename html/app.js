const [MobilizeMapperApp, runMobilizeMapperAppTests] = (function() {
    const perPageValues = [10, 25, 100];

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
                console.log(res);
                return res.json();
            })
            .then((res) => {
                action.handleSuccess(res);
            })
            .catch((err) => {
                action.handleError("" + err);
            });
    }

    function App(flags) {
        if(typeof React === "undefined") {
            console.error("Please include ReactJs scripts");
            return;
        }

        const api = mobilizeV1Api;

        const e = React.createElement;
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
                    ["timeslot_end", "gte_now"],
                    ["page", state.events.page],
                    ["perPage", state.events.perPage]
                ],
                handleSuccess: loadEvents,
                handleError: loadEventsError
            });
        }

        React.useEffect(() => {
            fetchEvents();
        }, [state.organizationId]);

        return e("div", {},
            e("p", {}, "Events:"),
            e("pre", {}, JSON.stringify(state.events, null, 2))
        );
    };

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
