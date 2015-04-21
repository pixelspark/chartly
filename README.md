# Chartly.js: build charts in the browser using d3.js and Blockly.

Chartly.js is a web component that allows end users to create ('program') a chart using the Blockly
visual programming environment. Charts are 'compiled' to a JSON specification for the chart. At run
time, Chartly interprets the JSON and draws the chart using d3.js. 

## How to use

Store the contents in a web-accessible folder and open chartly.html to try out the example editor. 
The example editor will also work when run directly from your hard drive (file://), only loading of
examples will fail. The example editor automatically generates fake numeric data of variable sizes
for testing purposes.

Using Chartly.js in your web application should be relatively straightforward; see the example editor
in chartly.html. Note that you can persist chart designs in JSON as well as XML, but only XML can be
read back to puzzle pieces (the JSON is meant for run-time rendering of a chart).

## JSON chart specification

The JSON used to specify instructions for rendering a chart follow a simple structure.  A 'command' 
is written as an array with two elements: the command identifier and its parameters (if any). Commands
can (and usually are) nested. An example of JSON produced by Chartly.js is the following:

````javascript
["align", {
	"vertical":"middle",
	"horizontal":"middle",
	"child": ["text", {
		"text": ["string", "Hello world"],
		"child":null,
		"next":null
	}],
	"next":null
}]
````
The example JSON above renders the text 'Hello world' in the center of the canvas. The root command
is `align` (with parameters vertical=middle and horizontal=middle). The `align` command takes a sub-
command for the `child` parameter, which is in this case is the `text` command. The `text` command 
takes a sub-command that specifies the actual text to render (in this case a string). Sibling items
can be inserted using the `next` parameter and child items using the `child` item, but this is not
the case in the example. 

## Contact
- Tommy van der Vorst
- Twitter: [@tommyvdv](http://twitter.com/tommyvdv)
- Web: [http://pixelspark.nl](http://pixelspark.nl)

## License

 Copyright (c) 2015 Tommy van der Vorst

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.

 This repository includes a compiled version of Blockly, which is used under the Apache License 2.0.
 It also includes a compiled version of d3.js, which is used under a BSD license. See the `LICENSE`
 file for additional details.