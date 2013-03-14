// 三角函数
define([ "doh","mathEditor/Model" ], function(doh,Model) {

	function testSupport(t, model, tri){
		model.setData({data:tri, nodeName:"mi"});
		isTri(t, model, tri);
	}
	
	function isTri(t, model, tri){
		t.is("/root/line[1]/math[1]/mrow[3]/mn[1]", model.getPath());
		
		var node = model.getFocusNode();
		t.is("mn", node.nodeName);
		t.is("drip_placeholder_box", node.getAttribute("class"));
		t.is(0, model.getOffset());
		
		var funNode = node.parentNode.previousSibling;
		t.is("mo",funNode.nodeName);
		t.is("&#x2061;",funNode.textContent);
		
		var triNode = funNode.previousSibling;
		t.is("mi", triNode.nodeName);
		t.is(tri, triNode.textContent);
	}
	
	doh.register("Model.setData 三角函数",[
	    {
  			name: "在空的数学编辑器上输入sin/cos/tan/cot/sec/csc",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				/*
  				 * <mi>cos</mi>
  				 * <mo>&#x2061;</mo> 函数应用
  				 * <mrow>
  				 * <mn></mn> 占位符统一使用mn表示
  				 * </mrow>
  				 */
  				var model = this.model;
  				// 其实下面这些都属于一类，一个测试用例足够。
  				// 但是在单个输入字符时，需要对每个三角函数进行判断，所以这里全部测试，
  				// 防止在代码实现时，遗漏处理的情况。
  				model.toMathMLMode();
  				testSupport(t,model,"sin");
  				model.clear();
  				
  				model.toMathMLMode();
  				testSupport(t,model,"cos");
  				model.clear();
  				
  				model.toMathMLMode();
  				testSupport(t,model,"tan");
  				model.clear();
  				
  				model.toMathMLMode();
  				testSupport(t,model,"cot");
  				model.clear();
  				
  				model.toMathMLMode();
  				testSupport(t,model,"sec");
  				model.clear();
  				
  				model.toMathMLMode();
  				testSupport(t,model,"csc");
  				model.clear();
  			},
  			tearDown: function(){
  				
  			}
  		},{
  			name: "mathml模式下，在已输入数字的model中输入三角函数",
  			setUp: function(){
  				this.model = new Model({});
  				this.model.toMathMLMode();
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.setData({data:"1"});
  				model.setData({data:"sin", nodeName:"mi"});
  				
  				t.is("/root/line[1]/math[1]/mrow[4]/mn[1]", model.getPath());
  				var node = model.getFocusNode();
  				t.is("mn", node.nodeName);
  				t.is("drip_placeholder_box", node.getAttribute("class"));
  				t.is(0, model.getOffset());
  				
  				var funNode = node.parentNode.previousSibling;
  				t.is("mo",funNode.nodeName);
  				t.is("&#x2061;",funNode.textContent);
  				
  				var triNode = funNode.previousSibling;
  				t.is("mi", triNode.nodeName);
  				t.is("sin", triNode.textContent);
  			},
  			tearDown: function(){
  				
  			}
  		},
	    // 分为一次性输入，和单个字符串的输入，
	    // 注意，删除的时候，敲一次删除键，删除整个操作符
  		{
  			name: "逐个字母的连续输入一个三角函数sin",
  			setUp: function(){
  				this.model = new Model({});
  				this.model.toMathMLMode();
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.setData({data:"1"});
  				
  				model.setData({data:"s"});
  				t.is("/root/line[1]/math[1]/mi[2]", model.getPath());
  				
  				var node = model.getFocusNode();
  				t.is("mi", node.nodeName);
  				t.is("s", node.textContent);
  				t.is(1, model.getOffset());
  				
  				model.setData({data:"i"});
  				node = model.getFocusNode();
  				t.is("/root/line[1]/math[1]/mi[3]", model.getPath());
  				t.is("mi", node.nodeName);
  				t.is("i", node.textContent);
  				t.is(1, model.getOffset());
  				
  				model.setData({data:"n"});
  				t.is("/root/line[1]/math[1]/mrow[4]/mn[1]", model.getPath());
  				var node = model.getFocusNode();
  				t.is("mn", node.nodeName);
  				t.is("drip_placeholder_box", node.getAttribute("class"));
  				t.is(0, model.getOffset());
  				
  				var funNode = node.parentNode.previousSibling;
  				t.is("mo",funNode.nodeName);
  				t.is("&#x2061;",funNode.textContent);
  				
  				var triNode = funNode.previousSibling;
  				t.is("mi", triNode.nodeName);
  				t.is("sin", triNode.textContent);
  			},
  			tearDown: function(){
  				
  			}
  		},{
  			name: "mathml下，输入s，接着输入n，然后在n前面输入i，则组合成sin",
  			setUp: function(){
  				this.model = new Model({});
  				this.model.toMathMLMode();
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.setData({data:"1"});
  				
  				model.setData({data:"s"});
  				t.is("/root/line[1]/math[1]/mi[2]", model.getPath());
  				
  				var node = model.getFocusNode();
  				t.is("mi", node.nodeName);
  				t.is("s", node.textContent);
  				t.is(1, model.getOffset());
  				
  				model.setData({data:"n"});
  				node = model.getFocusNode();
  				t.is("/root/line[1]/math[1]/mi[3]", model.getPath());
  				t.is("mi", node.nodeName);
  				t.is("n", node.textContent);
  				t.is(1, model.getOffset());
  				
  				// 在mi之间往前移动的逻辑是offset不变，node改变
  				// 如果移动offset的话，则offset的值为0，表示在node的左边，
  				// 这个时候的处理逻辑是不一样的。
  				// FIXME：如果统一这个逻辑呢？是都在右边定位呢，还是允许在左边定位呢，只能选择其中一种
  				// 如果只能在右边定位，则往左移动到最前面时，则往上找父节点。
  				// 目前使用在右边定位
  				model.anchor.node = model.anchor.node.previousSibling;
  				// 注意，移动时，如果节点发生了变化，则也要调整model.path
  				var pos = model.path.pop();
  				pos.offset--;
  				model.path.push(pos);
  				
  				model.setData({data:"i"});
  				t.is("/root/line[1]/math[1]/mrow[4]/mn[1]", model.getPath());
  				var node = model.getFocusNode();
  				t.is("mn", node.nodeName);
  				t.is("drip_placeholder_box", node.getAttribute("class"));
  				t.is(0, model.getOffset());
  				
  				var funNode = node.parentNode.previousSibling;
  				t.is("mo",funNode.nodeName);
  				t.is("&#x2061;",funNode.textContent);
  				
  				var triNode = funNode.previousSibling;
  				t.is("mi", triNode.nodeName);
  				t.is("sin", triNode.textContent);
  			},
  			tearDown: function(){
  				
  			}
  		},{
  			name: "mathml下，输入i，接着输入n，然后在i前面输入s，则组合成sin",
  			setUp: function(){
  				this.model = new Model({});
  				this.model.toMathMLMode();
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.setData({data:"1"});
  				
  				model.setData({data:"i"});
  				t.is("/root/line[1]/math[1]/mi[2]", model.getPath());
  				
  				var node = model.getFocusNode();
  				t.is("mi", node.nodeName);
  				t.is("i", node.textContent);
  				t.is(1, model.getOffset());
  				
  				model.setData({data:"n"});
  				node = model.getFocusNode();
  				t.is("/root/line[1]/math[1]/mi[3]", model.getPath());
  				t.is("mi", node.nodeName);
  				t.is("n", node.textContent);
  				t.is(1, model.getOffset());
  				
  				model.anchor.node = model.anchor.node.previousSibling;
  				var pos = model.path.pop();
  				pos.offset--;
  				model.path.push(pos);
  				
  				model.anchor.node = model.anchor.node.previousSibling;
  				var pos = model.path.pop();
  				pos.offset--;
  				pos.nodeName = model.anchor.node.nodeName;
  				model.path.push(pos);
  				
  				model.setData({data:"s"});
  				t.is("/root/line[1]/math[1]/mrow[4]/mn[1]", model.getPath());
  				var node = model.getFocusNode();
  				t.is("mn", node.nodeName);
  				t.is("drip_placeholder_box", node.getAttribute("class"));
  				t.is(0, model.getOffset());
  				
  				var funNode = node.parentNode.previousSibling;
  				t.is("mo",funNode.nodeName);
  				t.is("&#x2061;",funNode.textContent);
  				
  				var triNode = funNode.previousSibling;
  				t.is("mi", triNode.nodeName);
  				t.is("sin", triNode.textContent);
  			},
  			tearDown: function(){
  				
  			}
  		}
  		
	]);
});
