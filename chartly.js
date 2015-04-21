/**  Chartly.js: interactively build charts in the browser using d3.js and Blockly.
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
 OTHER DEALINGS IN THE SOFTWARE. **/

// Language
if (!Blockly.Language) Blockly.Language = {};
if (!Blockly.JavaScript) Blockly.JavaScript = {};
	
// Blockly translations
Blockly.Msg.REMOVE_COMMENT = 'Remove Comment';
Blockly.Msg.ADD_COMMENT = 'Add Comment';
Blockly.Msg.EXTERNAL_INPUTS = 'External Inputs';
Blockly.Msg.INLINE_INPUTS = 'Inline Inputs';
Blockly.Msg.DELETE_BLOCK = 'Delete Block';
Blockly.Msg.DELETE_X_BLOCKS = 'Delete %1 Blocks';
Blockly.Msg.DISABLE_BLOCK = 'Disable block';
Blockly.Msg.ENABLE_BLOCK = 'Enable block';
Blockly.Msg.DUPLICATE_BLOCK = 'Duplicate block';
Blockly.Msg.COLLAPSE_BLOCK = 'Collapse Block';
Blockly.Msg.EXPAND_BLOCK = 'Expand Block';
Blockly.Msg.HELP = 'Help';
Blockly.Msg.CHANGE_VALUE_TITLE = 'Change value:';
Blockly.Msg.NEW_VARIABLE = 'New variable...';
Blockly.Msg.NEW_VARIABLE_TITLE = 'New variable name:';
Blockly.Msg.RENAME_VARIABLE = 'Rename variable...';
Blockly.Msg.RENAME_VARIABLE_TITLE = 'Rename all "%1" variables to:';
Blockly.Msg.VARIABLE_CATEGORY = 'Variables';
Blockly.Msg.PROCEDURE_CATEGORY = 'Procedures';
Blockly.Msg.MUTATOR_TOOLTIP = 'Edit this block';
Blockly.Msg.MUTATOR_HEADER = 'Block Editor';
Blockly.Msg.MUTATOR_CHANGE = 'Change';
Blockly.Msg.MUTATOR_CANCEL = 'Cancel';

var Settings = {
	themeColors: [
		['blue', '#003764'],
		['light blue', '#BBE0E3'],
		['green', '#98CB00'],
		['purple', '#800080'],
		['red', '#EC0000'],
		['yellow', '#FCC00']
	]
};

var DiaState = function DiaState(parent) {
	this.stack = [];
	this.data = null;
	this.columnNames = null;
	this.variables = {};
	this.parent = parent || null;
}

DiaState.prototype = {
	push: function(p) { 
		this.stack.push(p); 
	},

	top: function(p) { 
		if(this.stack.length>0) {
			return this.stack[this.stack.length-1]; 
		}
		return this.parent.top();
	},

	pop: function(p) { 
		if(this.stack.length>0) {
			return this.stack.pop(); 
		}
		return this.parent.pop();
	},

	getVariable: function(k) { 
		if(k.toLowerCase() in this.variables) {
			return this.variables[k.toLowerCase()];
		}
		else if(this.parent) {
			return this.parent.getVariable(k);
		}
		else {
			throw new Error("Variable " + k + " does not exist!");
		}
	},

	setVariable: function(k, v) {
		this.variables[k.toLowerCase()] = v; 
	},

	clone: function() {
		return new DiaState(this);
	},

	getColumnNames: function() {
		if(this.columnNames!==null) {
			return this.columnNames;
		}
		return this.parent.getColumnNames();
	},

	indexOfColumnWithName: function(soughtName) {
		soughtName = soughtName.toLowerCase();

		var cn = this.getColumnNames();
		for(var a=0; a<cn.length; a++) {
			if(cn[a].toLowerCase() == soughtName) {
				return a;
			}
		}
		return null;
	},

	getData: function() {
		if(this.data!==null) {
			return this.data;
		}
		return this.parent.getData();
	},

	cell: function(rn, cn) {
		return this.getData()[rn][cn];
	}
};

var Chartly = function Chartly() {
	if(Blockly) {
		for(var k in this._blocks) {
			var bd = this._blocks[k];
			Blockly.Blocks[k] = {init: bd.block, category: bd.category};
		}
	}
}

Chartly.prototype = {
	getBlocklyOptions: function() {
		var toolbox = document.createElement("xml");
		var categories = {};
		var categoryNames = [];

		// Loop alle bloktypen af
		for (var blockType in Blockly.Blocks) {
			var blockInfo = Blockly.Blocks[blockType];

			if(blockInfo.category) {
				// Maak een toolbox item
				var item = document.createElement("block");
				item.setAttribute("type", blockType);

				if(!categories[blockInfo.category]) {
					var cat = document.createElement("category");
					cat.setAttribute("name", blockInfo.category);
					categories[blockInfo.category] = cat;
					categoryNames.push(blockInfo.category);
				}
				categories[blockInfo.category].appendChild(item);
			}
		}

		// Sort categories and add
		categoryNames.sort();
		for(var a=0; a<categoryNames.length; a++) {
			toolbox.appendChild(categories[categoryNames[a]]);
		}

		return {toolbox: toolbox};
	},

	codeForBlock: function(block) {
		if(!block) {
			return null;
		}

		if(this._blocks[block.type]) {
			var code = [block.type, this._blocks[block.type].generate(block)]
			if(block.disabled) {
				code[1].disabled = true;
			}
			return code;
		}
		else {
			throw new Error("Unknown block type: "+block.type);
		}
	},

	codeForInput: function(block, inputName) {
		var inBlock = block.getInputTargetBlock(inputName);
		return inBlock ? this.codeForBlock(inBlock) : null;
	},

	runCode: function(blockJson, state) {
		if(blockJson && Array.isArray(blockJson) && blockJson.length>0) {
			if(this._blocks[blockJson[0]]) {
				return this._blocks[blockJson[0]].run(blockJson[1], state, this);
			}
		}
		else {
			throw new Error("Missing puzzle piece!");
		}
	},

	_blocks: {
		/** The string puzzle piece returns a single, constant string value. **/
		"string": {
			category: "Value",
			block: function() {
				this.setColour(230);
				this.appendDummyInput().appendField(new Blockly.FieldTextInput('foo'), 'data');
				this.setOutput(true);
			},

			generate: function(pzl) {
				return pzl.getFieldValue('data');
			},

			run: function(data, state, context) {
				return data;
			}
		},

		/** This puzzle piece returns the value of a specified variable. **/
		"load": {
			category: "Value",
			block: function() {
				this.setColour(230);
				this.appendDummyInput().appendField("The").appendField(new Blockly.FieldTextInput('foo'), 'variable');
				this.setOutput(true);
			},

			generate: function(pzl) {
				return pzl.getFieldValue('variable');
			},

			run: function(data, state, context) {
				return state.getVariable(data);
			}
		},

		/** Return the width of the parent container **/
		"width": {
			category: "Lay-out",
			block: function() {
				this.setColour(230);
				this.appendDummyInput().appendField("width");
				this.setOutput(true);
			},

			generate: function(pzl) {
				return {};
			},

			run: function(data, state, context) {
				return state.top().node().getBBox().width;
			}
		},

		/** Return the width of the parent container **/
		"height": {
			category: "Lay-out",
			block: function() {
				this.setColour(230);
				this.appendDummyInput().appendField("height");
				this.setOutput(true);
			},

			generate: function(pzl) {
				return {};
			},

			run: function(data, state, context) {
				return state.top().node().getBBox().height;
			}
		},

		"store": {
			category: "Value",

			block: function() {
				this.setColour(230);
				this.setPreviousStatement(true);
				this.setNextStatement(true);
				this.appendValueInput("value").appendField("Let the").appendField(new Blockly.FieldTextInput("variable"), "variable").appendField("=");
			},

			generate: function(pzl) { return {
				variable: pzl.getFieldValue("variable"),
				value: Chartly.prototype.codeForInput(pzl, "value"),
				next: Chartly.prototype.codeForBlock(pzl.getNextBlock())
			}; },

			run: function(data, state, context) {
				state.setVariable(data.variable, context.runCode(data.value, state));
				if(data.next) context.runCode(data.next, state);
			}
		},

		"count": {
			category: "Value",

			block: function() {
				this.setColour(230);
				this.setOutput(true);
				this.appendValueInput("value").appendField("number of");
			},

			generate: function(pzl) { return {
				value: Chartly.prototype.codeForInput(pzl, "value")
			}; },

			run: function(data, state, context) {
				var value = context.runCode(data.value, state);
				return value.length || 0;
			}
		},

		/** The cell puzzle piece returns the value in the indicated column in the current row. The
		current row is stored in the state object. **/
		"cell": {
			category: "Value",
			block: function() {
				this.setColour(230);
				this.appendValueInput("row").appendField("Value in row");
				this.appendValueInput("column").appendField("column");
				this.setInputsInline(true);
				this.setOutput(true);
			},

			generate: function(pzl) {
				return {
					row: Chartly.prototype.codeForInput(pzl, "row"),
					column: Chartly.prototype.codeForInput(pzl, "column")
				};
			},

			run: function(data, state, context) {
				var rowNumber = context.runCode(data.row, state);
				var colNumber = context.runCode(data.column, state);
				return state.cell(rowNumber, colNumber);
			}
		},

		/** Returns the set of row numbers (starting at 0). **/
		"rows": {
			category: "Value",
			block: function() {
				this.setColour(230);
				this.appendDummyInput().appendField("rows");
				this.setOutput(true);
			},

			generate: function(pzl) {
				return {};
			},

			run: function(data, state, context) {
				var rows = [];
				for(var a=0; a<state.getData().length; a++) {
					rows.push(a);
				}
				return rows;
			}
		},

		/** Returns the set of column names. **/
		"columns": {
			category: "Value",
			block: function() {
				this.setColour(230);
				this.appendDummyInput().appendField("columns");
				this.setOutput(true);
			},

			generate: function(pzl) {
				return {};
			},

			run: function(data, state, context) {
				var cns = [];
				for(var a=0; a<state.getColumnNames().length; a++) {
					cns.push(a);
				}
				return cns;
			}
		},

		/** Returns the set of column names. **/
		"columnName": {
			category: "Value",
			block: function() {
				this.setColour(230);
				this.appendValueInput("index").appendField("name of column");
				this.setOutput(true);
			},

			generate: function(pzl) {
				return {
					index: Chartly.prototype.codeForInput(pzl, "index")
				};
			},

			run: function(data, state, context) {
				var idx = context.runCode(data.index, state);
				return state.getColumnNames()[idx];
			}
		},

		"color": {
			category: "Style",

			block: function() {
				var options = [["fill color", "fill"], ["border color", "stroke"]];
				this.setColour(1);
				this.appendDummyInput().appendField("Set").appendField(new Blockly.FieldDropdown(options), "attribute").appendField("to").appendField(new Blockly.FieldColour(), "color");
				this.setPreviousStatement(true);
				this.setNextStatement(true);
			},

			generate: function(pzl) { return {
				attribute: pzl.getFieldValue("attribute"),
				color: pzl.getFieldValue("color"),
				next: Chartly.prototype.codeForBlock(pzl.getNextBlock())
			}; },

			run: function(data, state, context) {
				if(data.disabled) return;
				state.top().style(data.attribute, data.color);
				if(data.next) context.runCode(data.next, state);
			}
		},


		"alpha": {
			category: "Style",

			block: function() {
				var options = [["shape", "opacity"], ["border", "stroke-opacity"], ["fill", "fill-opacity"]];

				this.setColour(1);
				this.appendValueInput("alpha").appendField("Set").appendField(new Blockly.FieldDropdown(options), "type").appendField("opacity %");
				this.setPreviousStatement(true);
				this.setNextStatement(true);
			},

			generate: function(pzl) { return {
				type: pzl.getFieldValue("type"),
				alpha: Chartly.prototype.codeForInput(pzl, "alpha"),
				next: Chartly.prototype.codeForBlock(pzl.getNextBlock())
			}; },

			run: function(data, state, context) {
				if(data.disabled) return;
				state.top().style(data.type, context.runCode(data.alpha, state) / 100.0);
				if(data.next) context.runCode(data.next, state);
			}
		},

		/** This puzzle piece iterates over all rows in the data set (from start to end) and executed
		the underlying puzzle piece once for each row **/
		"forEach": {
			category: "Logic",
			block: function() {
				this.setColour(170);
				this.appendValueInput("set").appendField("For each").appendField(new Blockly.FieldTextInput("item"),"variable").appendField("in");
				this.appendStatementInput("next");
				this.setPreviousStatement(true);
				this.setNextStatement(true);
				this.setInputsInline(true);
			},

			generate: function(pzl) {
				return {
					set: Chartly.prototype.codeForInput(pzl, "set"),
					variable: pzl.getFieldValue("variable"),
					next: Chartly.prototype.codeForBlock(pzl.getNextBlock()),
					child: Chartly.prototype.codeForInput(pzl, "next")
				}
			},

			run: function(data, state, context) {
				if(!data.disabled) {
					var set = context.runCode(data.set, state);
					if(!Array.isArray(set)) {
						set = [set];
					}

					for(var a=0; a<set.length; a++) {
						var subState = state.clone();
						subState.setVariable(data.variable, set[a]);
						context.runCode(data.child, subState);
					}
				}

				if(data.next) {
					context.runCode(data.next, state);
				}
			}
		},

		/** Adds a graphical element to the graphics stack that translates its contents in the specified
		direction. **/
		"translate": {
			category: "Transform",
			block: function() {
				this.setColour(120);
				this.appendValueInput("x").appendField("Translate").appendField("x");
				this.appendValueInput("y").appendField("y");
				this.appendStatementInput("child");
				this.setPreviousStatement(true);
				this.setNextStatement(true);
				this.setInputsInline(true);
			},

			generate: function(pzl) {
				return {
					x: Chartly.prototype.codeForInput(pzl, "x"),
					y: Chartly.prototype.codeForInput(pzl, "y"),
					child: Chartly.prototype.codeForInput(pzl, "child"),
					next: Chartly.prototype.codeForBlock(pzl.getNextBlock())
				}
			},

			run: function(data, state, context) {
				if(!data.disabled) {
					var parent = state.top();
					var tx = data.x ? context.runCode(data.x, state) : 0;
					var ty = data.y ? context.runCode(data.y, state) : 0;
					state.push(parent.append("g").attr("transform","translate("+(tx*1.0)+", "+(ty*1.0)+")"));
					context.runCode(data.child, state);
					state.pop();
				}
				if(data.next) context.runCode(data.next, state);
			}
		},

		/** Performs a calculation on two values. **/
		"binary": {
			category: "Value",
			operators: {
				"+": function(a,b) { return (1.0*a)+(1.0*b); },
				"-": function(a,b) { return a-b; },
				"*": function(a,b) { return a*b; },
				"/": function(a,b) { return a/b; },
				"&": function(a,b) { return (""+a)+(""+b); },
				"max": function(a,b) { return a>b ? a : b; },
				"min": function(a,b) { return a>b ? b : a; },
				"%": function(a,b) { return a % b; },
				"==": function(a,b) { return a==b ? 1 : 0; },
				"!=": function(a,b) { return a!=b ? 1 : 0; },
				">": function(a,b) { return a>b ? 1 : 0; },
				"<": function(a,b) { return a<b ? 1 : 0; }
			},

			block: function() {
				var choices = [];
				var operators = Chartly.prototype._blocks.binary.operators;
				for(var k in operators) {
					choices.push([k,k]);
				}

				this.setColour(230);
				this.appendValueInput("x");
				this.appendValueInput("y").appendField(new Blockly.FieldDropdown(choices), "operator");;
				this.setOutput(true);
				this.setInputsInline(true);
			},

			generate: function(pzl) {
				return {
					x: Chartly.prototype.codeForInput(pzl, "x"),
					y: Chartly.prototype.codeForInput(pzl, "y"),
					operator: pzl.getFieldValue("operator")
				}
			},

			run: function(data, state, context) {
				var operators = Chartly.prototype._blocks.binary.operators;
				var tx = (data.x ? context.runCode(data.x, state) : 0);
				var ty = (data.y ? context.runCode(data.y, state) : 0);
				var operator = operators[data.operator] || null;
				return operator ? operator(tx, ty) : null;
			}
		},

		/** Returns a column statistic. **/
		"stat": {
			category: "Value",
			operators: {
				"max": function(v) { return v.reduce(function(a,b) { return Math.max(a,b); }); },
				"min": function(v) { return v.reduce(function(a,b) { return Math.min(a,b); }); },
				"sum": function(v) { return v.reduce(function(a,b) { return a+b; }); },
				"avg": function(v) { return v.reduce(function(a,b) { return a+b; }) / v.length; },

				"stdev": function(v) {
					var average = v.reduce(function(a,b) { return a+b; }) / v.length;
					var diffs = v.map(function(a) { return Math.pow(a-average,2); }).reduce(function(a,b) { return a+b; });
					return Math.sqrt(diffs);
				}
			},

			block: function() {
				var choices = [];
				var operators = Chartly.prototype._blocks.stat.operators;
				for(var k in operators) {
					choices.push([k,k]);
				}

				this.setColour(230);
				this.appendValueInput("column").appendField(new Blockly.FieldDropdown(choices), "operator").appendField("of column");
				this.setOutput(true);
				this.setInputsInline(true);
			},

			generate: function(pzl) {
				return {
					column: Chartly.prototype.codeForInput(pzl, "column"),
					operator: pzl.getFieldValue("operator")
				}
			},

			run: function(data, state, context) {
				var operators = Chartly.prototype._blocks.stat.operators;
				var columnIndex = context.runCode(data.column, state);
				var operator = operators[data.operator] || null;

				var values = [];
				for(var a=0; a<state.getData().length; a++) {
					var row = state.getData()[a];
					values.push(row[columnIndex]);
				}
				return operator ? operator(values) : null;
			}
		},

		/** Adds a translation unit under the current graphical object of which the (0,0) coordinates
		are exactly in the center of the parent object. **/
		"align": {
			category: "Lay-out",
			block: function() {
				var horizontalOptions = ["left", "middle", "right"].map(function(k) { return [k,k]; });
				var verticalOptions = ["top", "middle", "bottom"].map(function(k) { return [k,k]; });

				this.setColour(120);
				this.appendDummyInput().appendField("Align")
					.appendField(new Blockly.FieldDropdown(horizontalOptions), "horizontal")
					.appendField(new Blockly.FieldDropdown(verticalOptions), "vertical");
				this.appendStatementInput("child");
				this.setPreviousStatement(true);
				this.setNextStatement(true);
				this.setInputsInline(true);
			},

			generate: function(pzl) {
				return {
					vertical: pzl.getFieldValue("vertical"),
					horizontal: pzl.getFieldValue("horizontal"),
					child: Chartly.prototype.codeForInput(pzl, "child"),
					next: Chartly.prototype.codeForBlock(pzl.getNextBlock())
				}
			},

			run: function(data, state, context) {
				var parent = state.top();
				var parentBox = parent.node().getBBox();

				var container = parent.append("g");
				state.push(container);
				if(data.child) {
					context.runCode(data.child, state);
				}
				state.pop();

				// Adjust the container to center its contents
				var childrenBox = container.node().getBBox();
				var tx = 0, ty = 0;

				if(data.horizontal == "left") {
					tx = 0 - childrenBox.x;
				}
				else if(data.horizontal == "right") {
					tx = parentBox.width - childrenBox.width - childrenBox.x;
				}
				else if(data.horizontal == "middle") {
					tx = (parentBox.width - childrenBox.width)/2 - childrenBox.x;
				}

				if(data.vertical == "top") {
					ty = 0 - childrenBox.y;
				}
				else if(data.vertical == "bottom") {
					ty = parentBox.height - childrenBox.height - childrenBox.y;
				}
				else if(data.vertical == "middle") {
					ty = (parentBox.height - childrenBox.height)/2 - childrenBox.y;
				}

				container.attr("transform","translate("+tx+" "+ty+")");


				if(data.next) context.runCode(data.next, state);
			}
		},

		/** Adds a translation unit under the current graphical object of which the (0,0) coordinates
		are exactly in the center of the parent object. **/
		"margin": {
			category: "Lay-out",
			block: function() {
				this.setColour(120);
				this.appendValueInput("size").appendTitle("Margin");
				this.appendStatementInput("child");
				this.setPreviousStatement(true);
				this.setNextStatement(true);
				this.setInputsInline(true);
			},

			generate: function(pzl) {
				return {
					size: Chartly.prototype.codeForInput(pzl, "size"),
					child: Chartly.prototype.codeForInput(pzl, "child"),
					next: Chartly.prototype.codeForBlock(pzl.getNextBlock())
				}
			},

			run: function(data, state, context) {
				if(!this.disabled) {
					var parent = state.top();
					var bbox = parent.node().getBBox();
					var margin = context.runCode(data.size, state);
					var container = parent.append("g");
					container.attr("transform","translate("+margin+" "+margin+")");
					var filler = container.append("rect")
						.attr("fill", "transparent")
						.attr("stroke", "none")
						.attr("width", bbox.width - 2 * margin)
						.attr("height", bbox.height - 2 * margin)

					state.push(container);
					if(data.child) context.runCode(data.child, state);
					state.pop();
				}

				if(data.next) context.runCode(data.next, state);
			}
		},

		/** Adds a graphical element to the graphics stack that rotates its contents by the specified
		number of degrees. **/
		"rotate": {
			category: "Transform",
			block: function() {
				this.setColour(120);
				this.appendValueInput("degrees").appendField("Rotate");
				this.appendDummyInput().appendField("degrees");
				this.appendStatementInput("next");
				this.setPreviousStatement(true);
				this.setInputsInline(true);
			},

			generate: function(pzl) {
				return {
					degrees: Chartly.prototype.codeForInput(pzl, "degrees"),
					next: Chartly.prototype.codeForInput(pzl, "next")
				}
			},

			run: function(data, state, context) {
				var parent = state.top();
				var tx = context.runCode(data.degrees, state);
				state.push(parent.append("g").attr("transform","rotate("+(tx*1.0)+")"));
				context.runCode(data.next, state);
				state.pop();
			}
		},

		/** Adds a graphical element to the graphics stack that scales its contents by the specified
		scale factor. **/
		"scale": {
			category: "Transform",
			block: function() {
				this.setColour(120);
				this.appendValueInput("factor").appendField("Scale");
				this.appendDummyInput().appendField("times");
				this.appendStatementInput("next");
				this.setPreviousStatement(true);
				this.setInputsInline(true);
			},

			generate: function(pzl) {
				return {
					factor: Chartly.prototype.codeForInput(pzl, "factor"),
					next: Chartly.prototype.codeForInput(pzl, "next")
				}
			},

			run: function(data, state, context) {
				var parent = state.top();
				var tx = context.runCode(data.factor, state);
				state.push(parent.append("g").attr("transform","scale("+(tx*1.0)+")"));
				context.runCode(data.next, state);
				state.pop();
			}
		},

		/** Adds a graphical element to the graphics stack that scales its contents by the specified
		scale factor. **/
		"conditional": {
			category: "Logic",
			block: function() {
				this.setColour(120);
				this.appendValueInput("condition").appendField("If");
				this.appendStatementInput("child");
				this.setPreviousStatement(true);
				this.setNextStatement(true);
				this.setInputsInline(true);
			},

			generate: function(pzl) {
				return {
					condition: Chartly.prototype.codeForInput(pzl, "condition"),
					next: Chartly.prototype.codeForBlock(pzl.getNextBlock()),
					child: Chartly.prototype.codeForInput(pzl, "child")
				}
			},

			run: function(data, state, context) {
				if(!data.disabled) {
					if(data.child) {
						var outcome = context.runCode(data.condition, state);
						if(outcome) {
							context.runCode(data.child, state);
						}
					}
				}

				if(data.next) context.runCode(data.next, state);
			}
		},

		/** Circle **/
		"circle": {
			category: "Shape",
			block: function() {
				this.setColour(120);
				this.appendValueInput("radius").appendField("Circle radius");
				this.appendStatementInput("child");
				this.setPreviousStatement(true);
				this.setNextStatement(true);
			},

			generate: function(pzl) {
				return {
					radius: Chartly.prototype.codeForInput(pzl, "radius"),
					child: Chartly.prototype.codeForInput(pzl, "child"),
					next: Chartly.prototype.codeForBlock(pzl.getNextBlock())
				};
			},

			run: function(data, state, context) {
				if(!this.disabled) {
					var parent = state.top();
					var g = parent.append("g");
					g.append("circle")
						.attr("r", context.runCode(data.radius, state));

					if(data.child) {
						state.push(g);
						context.runCode(data.child, state);
						state.pop();
					}
				}

				if(data.next) {
					context.runCode(data.next, state);
				}
			}
		},

		/** Draws a rectangle. **/
		"rect": {
			category: "Shape",
			block: function() {
				this.setColour(120);
				this.appendValueInput("width").appendField("Rectangle width");
				this.appendValueInput("height").appendField("height");
				this.appendStatementInput("child");
				this.setPreviousStatement(true);
				this.setNextStatement(true);
			},

			generate: function(pzl) {
				return {
					width: Chartly.prototype.codeForInput(pzl, "width"),
					height: Chartly.prototype.codeForInput(pzl, "height"),
					child: Chartly.prototype.codeForInput(pzl, "child"),
					next: Chartly.prototype.codeForBlock(pzl.getNextBlock())
				};
			},

			run: function(data, state, context) {
				var parent = state.top();
				var g = parent.append("g");
				g.append("rect")
					.attr("width", context.runCode(data.width, state))
					.attr("height", context.runCode(data.height, state))

				if(data.child) {
					state.push(g);
					context.runCode(data.child, state);
					state.pop();
				}

				if(data.next) {
					context.runCode(data.next, state);
				}
			}
		},

		/** Draws a text label. **/
		"text": {
			category: "Shape",
			block: function() {
				this.setColour(120);
				this.appendValueInput("text").appendField("Text");
				this.appendStatementInput("child");
				this.setPreviousStatement(true);
				this.setNextStatement(true);
			},

			generate: function(pzl) {
				return {
					text: Chartly.prototype.codeForInput(pzl, "text"),
					child: Chartly.prototype.codeForInput(pzl, "child"),
					next: Chartly.prototype.codeForBlock(pzl.getNextBlock())
				};
			},

			run: function(data, state, context) {
				var text = context.runCode(data.text, state);
				var parent = state.top();
				var g = parent.append("g");
				g.append("text").style("text-anchor", "start").text(text);

				if(data.child) {
					state.push(g);
					context.runCode(data.child, state);
					state.pop();
				}

				if(data.next) {
					context.runCode(data.next, state);
				}
			}
		}
	}
};