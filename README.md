# mobilize-mapper
View Mobilize Events on a Map!

## Using the App

Simple for now! Navigate to `html/index.html` in this project.

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