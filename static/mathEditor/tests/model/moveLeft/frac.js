define([ "intern!tdd", 
         "intern/chai!assert", 
         "mathEditor/Model", 
         "mathEditor/lang" ], function(
        		 tdd,
        		 assert, 
        		 Model, 
        		 dripLang) {

	// summary
	//		这里的测试逻辑有：
	//		1.在空的分数下
	//			由分数后面移到分母上
	//			由分母上移到分子上
	//			由分子移到分数前面
	//		2.涉及到两种模式之间的切换
	//			由text节点左移到math节点上
	//			由math节点左移到text节点上
	
	with(tdd){
		suite("Model.moveLeft.frac frac在分数之间左移光标", function(){
			
			var model = null;
			beforeEach(function () {
				model = new Model({});
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是token节点时,分数后面没有节点", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>1</mn></mrow>" +
			  						"<mrow><mn>22</mn></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
  						"</math>" +
  						"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild.lastChild.lastChild;
  				model.anchor.offset = 1;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mn", node.nodeName);
				assert.equal(2, model.getOffset());
				assert.equal("22", dripLang.getText(node));
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是layout节点时,layout没有被mstyle封装，分数后面没有节点", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>1</mn></mrow>" +
			  						"<mrow><mroot><mrow><mn>22</mn></mrow><mrow><mn>33</mn></mrow></mroot></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
  						"</math>" +
  						"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild.lastChild.lastChild;
  				model.anchor.offset = 1;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mroot[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mroot", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是layout节点时,layout被mstyle封装，分数后面没有节点", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>1</mn></mrow>" +
			  						"<mrow><mstyle><mfrac><mrow><mn>22</mn></mrow><mrow><mn>33</mn></mrow></mfrac></mstyle></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
  						"</math>" +
  						"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild.lastChild.lastChild;
  				model.anchor.offset = 1;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mfrac[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mfrac", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是token节点时,分数后面有一个token节点", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>1</mn></mrow>" +
			  						"<mrow><mn>22</mn></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
	  						"<mn>123</mn>" +
  						"</math>" +
  						"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.lastChild;
  				model.anchor.offset = 0;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mn", offset: 2});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mn", node.nodeName);
				assert.equal(2, model.getOffset());
				assert.equal("22", dripLang.getText(node));
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是layout节点时,layout没有被mstyle封装,分数后面有一个token节点", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>1</mn></mrow>" +
			  						"<mrow><mroot><mrow><mn>22</mn></mrow><mrow><mn>33</mn></mrow></mroot></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
	  						"<mn>123</mn>" +
  						"</math>" +
  						"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.lastChild;
  				model.anchor.offset = 0;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mn", offset: 2});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mroot[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mroot", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是layout节点时,layout被mstyle封装，分数后面是一个token节点", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>1</mn></mrow>" +
			  						"<mrow><mstyle><mfrac><mrow><mn>22</mn></mrow><mrow><mn>33</mn></mrow></mfrac></mstyle></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
	  						"<mn>123</mn>" +
  						"</math>" +
  						"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.lastChild;
  				model.anchor.offset = 0;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mn", offset: 2});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mfrac[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mfrac", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是token节点时,分数后面有一个layout节点,该layout节点没有被mstyle封装", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>1</mn></mrow>" +
			  						"<mrow><mn>22</mn></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
	  						"<mroot><mrow><mn>3</mn></mrow><mrow><mn>4</mn></mrow></mroot>" +
  						"</math>" +
  						"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.lastChild;
  				model.anchor.offset = 0;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mroot", offset: 2});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mn", node.nodeName);
				assert.equal(2, model.getOffset());
				assert.equal("22", dripLang.getText(node));
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是layout节点时,layout没有被mstyle封装,分数后面有一个layout节点,该layout节点没有被mstyle封装", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>1</mn></mrow>" +
			  						"<mrow><mroot><mrow><mn>22</mn></mrow><mrow><mn>33</mn></mrow></mroot></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
	  						"<mroot><mrow><mn>3</mn></mrow><mrow><mn>4</mn></mrow></mroot>" +
  						"</math>" +
  						"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.lastChild;
  				model.anchor.offset = 0;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mroot", offset: 2});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mroot[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mroot", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是layout节点时,layout被mstyle封装,分数后面有一个layout节点,该layout节点没有被mstyle封装", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>1</mn></mrow>" +
			  						"<mrow><mstyle><mfrac><mrow><mn>22</mn></mrow><mrow><mn>33</mn></mrow></mfrac></mstyle></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
	  						"<mroot><mrow><mn>3</mn></mrow><mrow><mn>4</mn></mrow></mroot>" +
  						"</math>" +
  						"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.lastChild;
  				model.anchor.offset = 0;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mroot", offset: 2});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mfrac[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mfrac", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是token节点时,分数后面有一个layout节点,该layout节点被mstyle封装", function(){
				model.loadData("<root><line>" +
						"<math>" +
							"<mstyle>" +
	  						"<mfrac>" +
		  						"<mrow><mn>1</mn></mrow>" +
		  						"<mrow><mn>22</mn></mrow>" +
	  						"</mfrac>" +
							"</mstyle>" +
							"<mstyle><mfrac><mrow><mn>3</mn></mrow><mrow><mn>4</mn></mrow></mfrac></mstyle>" +
						"</math>" +
						"</line></root>");
				model.mode = "mathml";
				var line = model.getLineAt(0);
				model.anchor.node = line.firstChild.lastChild.firstChild;
				model.anchor.offset = 0;
				model.path = [];
				model.path.push({nodeName: "root"});
				model.path.push({nodeName: "line", offset: 1});
				model.path.push({nodeName: "math", offset: 1});
				model.path.push({nodeName: "mfrac", offset: 2});
				model.moveLeft();
				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mn", node.nodeName);
				assert.equal(2, model.getOffset());
				assert.equal("22", dripLang.getText(node));
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是layout节点时,layout没有被mstyle封装,分数后面有一个layout节点,该layout节点被mstyle封装", function(){
				model.loadData("<root><line>" +
						"<math>" +
							"<mstyle>" +
	  						"<mfrac>" +
		  						"<mrow><mn>1</mn></mrow>" +
		  						"<mrow><mroot><mrow><mn>22</mn></mrow><mrow><mn>33</mn></mrow></mroot></mrow>" +
	  						"</mfrac>" +
							"</mstyle>" +
							"<mstyle><mfrac><mrow><mn>3</mn></mrow><mrow><mn>4</mn></mrow></mfrac></mstyle>" +
						"</math>" +
						"</line></root>");
				model.mode = "mathml";
				var line = model.getLineAt(0);
				model.anchor.node = line.firstChild.lastChild.firstChild;
				model.anchor.offset = 0;
				model.path = [];
				model.path.push({nodeName: "root"});
				model.path.push({nodeName: "line", offset: 1});
				model.path.push({nodeName: "math", offset: 1});
				model.path.push({nodeName: "mfrac", offset: 2});
				model.moveLeft();
				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mroot[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mroot", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
			test("mathml模式下，由分数后面左移到分母上，当分母上最后一个元素是layout节点时,layout被mstyle封装,分数后面有一个layout节点,该layout节点被mstyle封装", function(){
				model.loadData("<root><line>" +
						"<math>" +
							"<mstyle>" +
	  						"<mfrac>" +
		  						"<mrow><mn>1</mn></mrow>" +
		  						"<mrow><mstyle><mfrac><mrow><mn>22</mn></mrow><mrow><mn>33</mn></mrow></mfrac></mstyle></mrow>" +
	  						"</mfrac>" +
							"</mstyle>" +
							"<mstyle><mfrac><mrow><mn>3</mn></mrow><mrow><mn>4</mn></mrow></mfrac></mstyle>" +
						"</math>" +
						"</line></root>");
				model.mode = "mathml";
				var line = model.getLineAt(0);
				model.anchor.node = line.firstChild.lastChild.firstChild;
				model.anchor.offset = 0;
				model.path = [];
				model.path.push({nodeName: "root"});
				model.path.push({nodeName: "line", offset: 1});
				model.path.push({nodeName: "math", offset: 1});
				model.path.push({nodeName: "mfrac", offset: 2});
				model.moveLeft();
				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mfrac[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null); // 证明是分母。
				assert.equal("mfrac", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
			test("mathml模式下，执行左移，从分母最前面移到分子最后面，分母首节点是token节点，分子尾节点是token节点", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>11</mn></mrow>" +
			  						"<mrow><mn>22</mn></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
  						"</math>" +
  				"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild.lastChild.lastChild.lastChild.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.path.push({nodeName: "mrow", offset: 2});
  				model.path.push({nodeName: "mn", offset: 1});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[1]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.previousSibling == null); // 证明是分子。
				assert.equal("mn", node.nodeName);
				assert.equal(2, model.getOffset());
				assert.equal("11", dripLang.getText(node));
			});
			
			test("mathml模式下，执行左移，从分母最前面移到分子最后面，分母首节点是token节点，分子尾节点是layout节点", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mstyle><mfrac><mrow><mn>123</mn></mrow><mrow><mn>456</mn></mrow></mfrac></mstyle></mrow>" +
			  						"<mrow><mn>22</mn></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
  						"</math>" +
  				"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild.lastChild.lastChild.lastChild.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.path.push({nodeName: "mrow", offset: 2});
  				model.path.push({nodeName: "mn", offset: 1});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[1]/mfrac[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.previousSibling == null); // 证明是分子。
				assert.equal("mfrac", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
			test("mathml模式下，执行左移，从分母最前面移到分子最后面，分母首节点是layout节点，分子尾节点是token节点", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>22</mn></mrow>" +
			  						"<mrow><mstyle><mfrac><mrow><mn>123</mn></mrow><mrow><mn>456</mn></mrow></mfrac></mstyle></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
  						"</math>" +
  				"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild.lastChild.lastChild.lastChild.firstChild.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.path.push({nodeName: "mrow", offset: 2});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[1]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.previousSibling == null); // 证明是分子。
				assert.equal("mn", node.nodeName);
				assert.equal(2, model.getOffset());
			});
			
			test("mathml模式下，执行左移，从分母最前面移到分子最后面，分母首节点是layout节点，分子尾节点是layout节点", function(){
				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mstyle><mfrac><mrow><mn>111</mn></mrow><mrow><mn>222</mn></mrow></mfrac></mstyle></mrow>" +
			  						"<mrow><mstyle><mfrac><mrow><mn>123</mn></mrow><mrow><mn>456</mn></mrow></mfrac></mstyle></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
  						"</math>" +
  				"</line></root>");
  				model.mode = "mathml";
  				var line = model.getLineAt(0);
  				model.anchor.node = line.lastChild.lastChild.lastChild.lastChild.firstChild.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];
  				model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.path.push({nodeName: "mrow", offset: 2});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[1]/mfrac[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.previousSibling == null); // 证明是分子。
				assert.equal("mfrac", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
			test("mathml模式下，由分子前左移到分数前，当分子上的第一个元素是token节点时", function(){
				model.mode = "mathml";
  				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
			  						"<mrow><mn>1</mn></mrow>" +
			  						"<mrow><mn>22</mn></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
  						"</math>" +
  						"</line></root>");
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild.firstChild.firstChild.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.path.push({nodeName: "mrow", offset: 1});
  				model.path.push({nodeName: "mn", offset: 1});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]", model.getPath());
				var node = model.getFocusNode();
				assert.equal("mfrac", node.nodeName);
				assert.equal(0, model.getOffset());
			});
			
			test("mathml模式下，由分子前左移到分数前，当分子上第一个元素是layout节点时", function(){
				model.mode = "mathml";
  				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mstyle>" +
		  						"<mfrac>" +
		  						"<mrow><mstyle><mfrac><mrow><mn>22</mn></mrow><mrow><mn>33</mn></mrow></mfrac></mstyle></mrow>" +
		  						"<mrow><mn>1</mn></mrow>" +
		  						"</mfrac>" +
	  						"</mstyle>" +
  						"</math>" +
  						"</line></root>");
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.path.push({nodeName: "mrow", offset: 1});
  				model.path.push({nodeName: "mfrac", offset: 1});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]", model.getPath());
				var node = model.getFocusNode();
				assert.equal("mfrac", node.nodeName);
				assert.equal(0, model.getOffset());
			});
			
			
			
			
			
			
			
			test("mathml模式下，在空的分数上先右移光标，然后再左移", function(){
				model.toMathMLMode();
  				model.setData({data: "", nodeName: "mfrac"});
  				model.moveRight();
  				model.moveLeft();
  				
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[1]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.previousSibling == null);
				assert.equal("mn", node.nodeName);
				assert.equal("drip_placeholder_box", node.getAttribute("class"));
				assert.equal(0, model.getOffset());
			});
			
			test("mathml模式下，在空的分数上输入分子，右移光标到分母，在分母上输入一个数字，然后左移光标两次，此时光标在分子最后。", function(){
				model.toMathMLMode();
  				model.setData({data: "", nodeName: "mfrac"});
  				model.setData({data: "1"});
  				model.moveRight();
  				model.setData({data: "2"});
  				
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				assert.equal("mn", node.nodeName);
				assert.equal(0, model.getOffset());
				assert.equal("2", dripLang.getText(node));
  				
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[1]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				assert.ok(node.parentNode.previousSibling == null);
				assert.equal("mn", node.nodeName);
				assert.equal(1, model.getOffset());
				assert.equal("1", dripLang.getText(node));
			});
			
			test("mathml模式下，在空的分数上，左移一次光标，光标显示在整个分数之前", function(){
				model.toMathMLMode();
  				model.setData({data: "", nodeName: "mfrac"});
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]/mfrac[1]", model.getPath());
				var node = model.getFocusNode();
				// 如果是layout mathml节点获取焦点，则0表示所在节点之前，1表示所在节点之后。
				assert.equal("mfrac", node.nodeName);
				assert.equal(0, model.getOffset());
			});
			
			test("mathml模式下，在空的分数上，左移两次光标，光标显示在整个分数之前，此时光标已移出分数", function(){
				model.toMathMLMode();
  				model.setData({data: "", nodeName: "mfrac"});
  				model.moveLeft();
  				model.moveLeft();
  				assert.equal("/root/line[1]/math[1]", model.getPath());
				var node = model.getFocusNode();
				assert.equal("math", node.nodeName);
				assert.equal(0, model.getOffset());// 0表示在math节点之前
			});
			
			test("mathml模式下，在空的分数上，左移三次光标，光标显示在整个分数之前，此时光标已移出分数,并进入前一个节点", function(){
				model.setData({data: "a"});
  				model.toMathMLMode();
  				model.setData({data: "", nodeName: "mfrac"});// 光标停留在分子上
  				model.moveLeft();// 移到分数前
  				model.moveLeft();// 移到math节点前
  				model.moveLeft();// 移到text后
  				assert.equal("/root/line[1]/text[1]", model.getPath());
				var node = model.getFocusNode();
				assert.equal("text", node.nodeName);
				assert.equal(0, model.getOffset());// 光标应该停留在“a”前面
			});
			
			test("mathml模式下，在空的分数中，先移到整个分数的后面，然后左移到分母上", function(){
				model.toMathMLMode();
  				model.setData({data: "", nodeName: "mfrac"});
  				model.moveRight();// 移到分母
  				model.moveRight();// 移到整个分数后面
  				model.moveLeft();// 移到分母上
  				assert.equal("/root/line[1]/math[1]/mfrac[1]/mrow[2]/mn[1]", model.getPath());
  				var node = model.getFocusNode();
				assert.ok(node.parentNode.nextSibling == null);
				assert.equal("mn", node.nodeName);
				assert.equal("drip_placeholder_box", node.getAttribute("class"));
				assert.equal(0, model.getOffset());
			});
			
			test("从text节点左移到math节点中", function(){
				model.toMathMLMode();
  				model.setData({data: "", nodeName: "mfrac"});
  				model.moveRight();// 移到分母
  				model.moveRight();// 移到整个分数后面
  				model.moveRight();// 移出数学公式编辑区域
  				//model.toTextMode();
  				assert.ok(model.isTextMode());
  				model.setData({data: "a"});
  				model.moveLeft();// 移到a字母前面
  				model.moveLeft();// 模式切换，移到math节点中
  				assert.ok(model.isMathMLMode());
  				assert.equal("/root/line[1]/math[1]/mfrac[1]", model.getPath());
				var node = model.getFocusNode();
				assert.equal("mfrac", node.nodeName);
				assert.equal(1, model.getOffset());
			});
			
		    // TODO:测试分数前面有text节点的情况
		    // TODO:测试分数前面和后面有mathml token和layout节点的情况
		    // TODO：从分数外面移到分数里面
			
		});
	}
	
});