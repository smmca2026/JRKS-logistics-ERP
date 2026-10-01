const { DayPicker } = require('react-day-picker');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

try {
  ReactDOMServer.renderToString(React.createElement(DayPicker, { defaultMonth: undefined, mode: "single", selected: undefined }));
  console.log("SUCCESS");
} catch (e) {
  console.error(e);
}
