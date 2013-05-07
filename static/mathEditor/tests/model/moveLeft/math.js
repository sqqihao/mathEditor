define([ "doh","mathEditor/Model" ], function(doh,Model) {

	doh.register("Model.moveLeft.math",[
	    {
	    	name: "从math节点后，向左往math内层移动,移到token节点内容的后面,math后没有节点。",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><math><mn>12</mn></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild;
  				model.anchor.offset = 1;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveLeft();
  				// 直接移到token节点的内容后面。
  				t.is("/root/line[1]/math[1]/mn[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("mn", focusNode.nodeName);
  				t.is(2, model.getOffset());
  				t.t(model.isMathMLMode());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "从math节点后，向左往math内层移动,移到token节点内容的后面,math后有一个text节点。",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><math><mn>12</mn></math><text>123</text></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild;
  				model.anchor.offset = 0;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "text", offset: 2});
  				model.moveLeft();
  				// 直接移到token节点的内容后面。
  				t.is("/root/line[1]/math[1]/mn[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("mn", focusNode.nodeName);
  				t.is(2, model.getOffset());
  				t.t(model.isMathMLMode());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "从math节点后，向左往math内层移动,移到layout节点上，layout节点外没有mstyle节点,math后没有节点。",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><math><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild;
  				model.anchor.offset = 1;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveLeft();
  				// 直接移到layout节点的内容后面。
  				t.is("/root/line[1]/math[1]/mfrac[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("mfrac", focusNode.nodeName);
  				t.is(1, model.getOffset());
  				t.t(model.isMathMLMode());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	// TODO: 了解mstyle会应用在哪些地方。
	    	name: "从math节点后，向左往math内层移动,移到layout节点上，layout节点外有mstyle节点,math后没有节点。",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><math><mstyle displaystyle='true'><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></mstyle></math></line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild;
  				model.anchor.offset = 1;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveLeft();
  				// 直接移到layout节点的内容后面。
  				t.is("/root/line[1]/math[1]/mfrac[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("mfrac", focusNode.nodeName);
  				t.is(1, model.getOffset());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "math节点中没有子节点,左移进空的math中,math后有一个text节点",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><math></math><text>12</text></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild;
  				model.anchor.offset = 0;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "text", offset: 2});
  				model.moveLeft();
  				t.is("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("math", focusNode.nodeName);
  				t.is(2, model.getOffset());// 此时math中没有子节点，可以在math中插入节点
  				t.t(model.isMathMLMode());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "math节点中没有子节点,math前有一个text节点，左移出空的math",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><text>12</text><math></math></line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild;
  				model.anchor.offset = 2;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 2});
  				model.moveLeft();
  				t.is("/root/line[1]/math[2]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("math", focusNode.nodeName);
  				t.is(0, model.getOffset());
  				t.t(model.isTextMode());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	// TODO：这个时机，是不是mathml与text模式切换的最好时机呢？
	    	name: "向左移出math，从math节点的第一个token的内容最前面，向左往math外层移动。",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><math><mn>12</mn></math></line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild;
  				model.anchor.offset = 0;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mn", offset: 1});
  				model.moveLeft();
  				t.is("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("math", focusNode.nodeName);
  				t.is(0, model.getOffset());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "向左移出math，从math节点的第一个layout的节点最前面，向左往math外层移动,layout节点外没有mstyle节点。",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><math><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></math></line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild;
  				model.anchor.offset = 0;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.moveLeft();
  				t.is("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("math", focusNode.nodeName);
  				t.is(0, model.getOffset());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "向左移出math，从math节点的第一个layout的节点最前面，向左往math外层移动,layout节点外有mstyle节点。",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><math><mstyle displaystyle='true'><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></mstyle></math></line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild.firstChild;
  				model.anchor.offset = 0;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.moveLeft();
  				t.is("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("math", focusNode.nodeName);
  				t.is(0, model.getOffset());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "从math节点前，移到前面的text节点后",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><text>123</text><math><mn>12</mn></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild;
  				model.anchor.offset = 0;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 2});
  				model.moveLeft();
  				// 直接移到token节点的内容后面。
  				t.is("/root/line[1]/text[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("text", focusNode.nodeName);
  				t.is(2, model.getOffset());
  				t.t(model.isTextMode());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "math节点中没有子节点,左移进空的math中,math后没有任何节点",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><math></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 1;
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveLeft();
  				t.is("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("math", focusNode.nodeName);
  				t.is(2, model.getOffset());// 此时math中没有子节点，可以在math中插入节点
  				t.t(model.isMathMLMode());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "math节点中没有子节点,左移出空的math中",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.loadData("<root><line><math></math></line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 2;// 在空的math中间
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveLeft();
  				t.is("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				t.is("math", focusNode.nodeName);
  				t.is(0, model.getOffset());// 表示已经移到math之后
  				t.t(model.isTextMode());
  			},
  			tearDown: function(){
  				
  			}
	    }
	                             
	]);
});