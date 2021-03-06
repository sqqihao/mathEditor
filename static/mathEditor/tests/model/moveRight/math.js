define([ "intern!tdd", 
         "intern/chai!assert",
         "mathEditor/Model" ], function(
        		 tdd,
        		 assert,
        		 Model) {

	// anchor中只有一个offset值还不够，需要一个标识选中状态的信息，选中的起始和结束节点必须在同一个层级上。
	// math的offset=0，表示在math前，此时已到math外，已光标子math前的text节点最后是一样的。
	// 进入到math里面，才是mathml模式，offset为0或1，都是text模式，已离开math节点
	//
	with(tdd){
		suite("Model.moveRight.math", function(){
			
			var model = null;
			beforeEach(function () {
				model = new Model({});
			});
			
			test("从math节点前，math前没有任何节点，向右往math内层移动，移到token节点内容前面", function(){
				model.loadData("<root><line><math><mn>12</mn></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveRight();
  				// 直接移到token节点的内容后面。
  				assert.equal("/root/line[1]/math[1]/mn[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("mn", focusNode.nodeName);
  				assert.equal(0, model.getOffset());
  				assert.ok(model.isMathMLMode());
			});
			
			test("从math节点前，math前有一个text节点，向右往math内层移动，移到token节点内容的前面", function(){
				model.loadData("<root><line><text>123</text><math><mn>12</mn></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 3;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "text", offset: 1});
  				model.moveRight();
  				
  				assert.equal("/root/line[1]/math[2]/mn[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("mn", focusNode.nodeName);
  				assert.equal(0, model.getOffset());
  				assert.ok(model.isMathMLMode());
			});
			
			test("从math节点前，math前没有节点，向右往math内层移动,移到layout节点前面，layout节点外没有mstyle节点。", function(){
				model.loadData("<root><line><math><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveRight();
  				// 直接移到layout节点的内容后面。
  				assert.equal("/root/line[1]/math[1]/mfrac[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("mfrac", focusNode.nodeName);
  				assert.equal(0, model.getOffset());
  				assert.ok(model.isMathMLMode());
			});
			
			test("从math节点前，math前有一个text节点，向右往math内层移动,移到layout节点前面，layout节点外没有mstyle节点。", function(){
				model.loadData("<root><line><text>123</text><math><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 3;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "text", offset: 1});
  				model.moveRight();
  				// 直接移到layout节点的内容后面。
  				assert.equal("/root/line[1]/math[2]/mfrac[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("mfrac", focusNode.nodeName);
  				assert.equal(0, model.getOffset());
  				assert.ok(model.isMathMLMode());
			});
			
			test("从math节点前，向右往math内层移动,移到layout节点前面，layout节点外有mstyle节点。", function(){
				model.loadData("<root><line><math><mstyle displaystyle='true'><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></mstyle></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveRight();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("mfrac", focusNode.nodeName);
  				assert.equal(0, model.getOffset());
  				assert.ok(model.isMathMLMode());
			});
			
			// 注意，text的结尾和math的起始是一样的。
			test("math节点中没有子节点,右移进空的math中,math前有一个text节点", function(){
				model.loadData("<root><line><text>123</text><math></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 3;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "text", offset: 1});
  				model.moveRight();
  				assert.equal("/root/line[1]/math[2]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("math", focusNode.nodeName);
  				assert.equal(2, model.getOffset());// 此时math中没有子节点，可以在math中插入节点
  				assert.ok(model.isMathMLMode());
			});
			
			test("math节点中没有子节点,math后有一个text节点，右移出空的math", function(){
				model.loadData("<root><line><math></math><text>12</text></line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 2;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveRight();
  				assert.equal("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("math", focusNode.nodeName);
  				assert.equal(1, model.getOffset());
  				assert.ok(model.isTextMode());
			});
			
			test("向右移出math，从math节点的最后一个token的内容最后面，向右往math外层移动,math后没有任何节点。", function(){
				model.loadData("<root><line><math><mn>12</mn></math></line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild.lastChild;
  				model.anchor.offset = 2;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mn", offset: 1});
  				model.moveRight();
  				assert.equal("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("math", focusNode.nodeName);
  				assert.equal(1, model.getOffset());
  				assert.ok(model.isTextMode());
			});
			
			test("向右移出math，从math节点的最后一个layout的节点最后面，向右往math外层移动,layout节点外没有mstyle节点。", function(){
				model.loadData("<root><line><math><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></math></line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild.lastChild;
  				model.anchor.offset = 1;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.moveRight();
  				assert.equal("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("math", focusNode.nodeName);
  				assert.equal(1, model.getOffset());
  				assert.ok(model.isTextMode());
			});
			
			test("向右移出math，从math节点的最后一个layout的节点最后面，向右往math外层移动,layout节点外有mstyle节点。", function(){
				model.loadData("<root><line><math><mstyle displaystyle='true'><mfrac><mrow><mn>1</mn></mrow><mrow><mn>2</mn></mrow></mfrac></mstyle></math></line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild.lastChild.lastChild;
  				model.anchor.offset = 1;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.moveRight();
  				assert.equal("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("math", focusNode.nodeName);
  				assert.equal(1, model.getOffset());
  				assert.ok(model.isTextMode());
			});
			
			test("从math节点后，移到后面的text节点前", function(){
				model.loadData("<root><line><math><mn>12</mn></math><text>12</text></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 1;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveRight();
  				// 直接移到token节点的内容后面。
  				assert.equal("/root/line[1]/text[2]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("text", focusNode.nodeName);
  				assert.equal(1, model.getOffset());
  				assert.ok(model.isTextMode());
			});
			
			test("math节点中没有子节点,右移进空的math中", function(){
				model.loadData("<root><line><math></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveRight();
  				assert.equal("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("math", focusNode.nodeName);
  				assert.equal(2, model.getOffset());// 此时math中没有子节点，可以在math中插入节点
  				assert.ok(model.isMathMLMode());
			});
			
			test("math节点中没有子节点,右移出空的math中", function(){
				model.loadData("<root><line><math></math></line></root>");
  				model.mode = "text";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild;
  				model.anchor.offset = 2;// 在空的math中间
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.moveRight();
  				assert.equal("/root/line[1]/math[1]", model.getPath());
  				var focusNode = model.getFocusNode();
  				assert.equal("math", focusNode.nodeName);
  				assert.equal(1, model.getOffset());// 表示已经移到math之后
  				assert.ok(model.isTextMode());
			});
		});
	}
	
});