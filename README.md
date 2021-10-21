# mobilize-mapper
View Mobilize Events on a Map!

## Using the App

Simple for now! Navigate to `html/index.html` in this project.

You can also check out the Github-hosted demo here: https://ebhasker.github.io/mobilize-mapper/html/

## Running the Unit Tests

Simple for now! Navigate to `html/test.html` in this project.

## Plan

* Use React without JSX so we don't need a build pipline for now (see https://reactjs.org/docs/react-without-jsx.html)
* Get API query functionality working first
* Write some tests (qunit to keep it easy), possibly TDD it
* Pick a mapping library (leaflet or similar?), show results on map
* Pick relevant fields for each event to display, lay them out in a basic manner
* Pick a styling/widget framework and make it look nice
* Add a Python webserver (bottle? flask?) if we get to the user session persistence stuff

## Decisions made during development

* Using React Hooks to keep effects nice and modular
* Using qunit (see https://qunitjs.com/) since we're not using nodejs
* Defer server-side until we can't live without it, see how far we can get without it! :)
* Using Bulma (https://bulma.io/) for an easy-to-add CSS library

## Future work
Since I didn't get to work on this for as long as I would have liked, here are some future work items:
* Clicking on the location part of the card should center and bring up the relevant popup on the map
* Filters, obviously, starting with a location search bar
* When just viewing the full list of events, center and locate the map around those events
* Use the Location/History Web APIs to update the query string to match filters that are set (such as location, etc.) so that a user can bookmark a search link
* Use the cursor versions of prev/next provided in the API results, instead of ?page=X
* Bring in a Python webserver and add the React toolchain so as to implement user sessions
* More unit tests!
