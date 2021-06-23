const MobilizeMapperApp = (function() { // IIFE
    return function() {
        // make sure we have the React scripts in our HTML
        if(typeof React === "undefined") {
            console.error("Please include ReactJs scripts");
            return;
        }

        // just get something working for now...
        const e = React.createElement;
        return e("div", {},
            e("p", {}, "Hello, World!")
        );
    };
})();
