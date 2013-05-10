define([ "doh","mathEditor/Model" ], function(doh,Model) {

	// summary:
	//		在括号上右移光标（目前只支持一个mrow子节点）
	//		右移进括号，
	//		1. 括号前没有任何节点，括号内第一个节点是token节点
	//		2. 括号前没有任何节点，括号内第一个节点是layout节点
	//		3. 括号前有一个token节点，从token后右移进括号内的第一个节点，第一个节点是token节点
	//		4. 括号前有一个token节点，从token后右移进括号内的第一个节点，第一个节点是layout节点
	//		5. 括号前有一个layout节点，从layout后右移进括号内第一个节点，第一个节点是token节点
	//		6. 括号前有一个layout节点，从layout后右移进括号内的第一个节点，第一个节点是layout节点
	//		右移出括号
	//		1. 括号内最后一个节点是token节点
	//		2. 括号内最后一个节点是layout节点
	doh.register("Model.moveRight.fence 在括号上右移光标",[
	    {
	    	name: "右移进括号，括号前没有任何节点，括号内第一个节点是token节点",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.mode = "mathml";
  				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mfence>" +
		  						"<mrow><mn>123</mn></mrow>" +
	  						"</mfence>" +
  						"</math>" +
  				"</line></root>");
  				
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfence", offset: 1});
  				model.moveRight();
  				t.is("/root/line[1]/math[1]/mfence[1]/mrow[1]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				t.is("mn", node.nodeName);
				t.is(0, model.getOffset());
				t.is("123", node.textContent);
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "右移进括号，括号前没有任何节点，括号内第一个节点是layout节点",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.mode = "mathml";
  				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mfence>" +
		  						"<mrow><mfence><mrow><mn>12</mn></mrow></mfence></mrow>" +
	  						"</mfence>" +
  						"</math>" +
  				"</line></root>");
  				
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild;
  				model.anchor.offset = 0;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfence", offset: 1});
  				model.moveRight();
  				t.is("/root/line[1]/math[1]/mfence[1]/mrow[1]/mfence[1]", model.getPath());
				var node = model.getFocusNode();
				t.is("mfence", node.nodeName);
				t.is(0, model.getOffset());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "右移进括号，括号前有一个token节点，从token后右移进括号内的第一个节点，第一个节点是token节点",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.mode = "mathml";
  				model.loadData("<root><line>" +
  						"<math>" +
  							"<mn>1</mn>" +
	  						"<mfence>" +
		  						"<mrow><mn>12</mn></mrow>" +
	  						"</mfence>" +
  						"</math>" +
  				"</line></root>");
  				
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild;
  				model.anchor.offset = 1;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mn", offset: 1});
  				model.moveRight();
  				t.is("/root/line[1]/math[1]/mfence[2]/mrow[1]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				t.is("mn", node.nodeName);
				t.is(0, model.getOffset());
				t.is("12", node.textContent);
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "右移进括号，括号前有一个token节点，从token后右移进括号内的第一个节点，第一个节点是layout节点",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.mode = "mathml";
  				model.loadData("<root><line>" +
  						"<math>" +
  							"<mn>1</mn>" +
	  						"<mfence>" +
		  						"<mrow><mfence><mrow><mn>12</mn></mrow></mfence></mrow>" +
	  						"</mfence>" +
  						"</math>" +
  				"</line></root>");
  				
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild;
  				model.anchor.offset = 1;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mn", offset: 1});
  				model.moveRight();
  				t.is("/root/line[1]/math[1]/mfence[2]/mrow[1]/mfence[1]", model.getPath());
				var node = model.getFocusNode();
				t.is("mfence", node.nodeName);
				t.is(0, model.getOffset());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "右移进括号，括号前有一个layout节点，从layout后右移进括号内第一个节点，第一个节点是token节点",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.mode = "mathml";
  				model.loadData("<root><line>" +
  						"<math>" +
  							"<mfence><mrow><mn>12</mn></mrow></mfence>" +
	  						"<mfence>" +
		  						"<mrow><mn>123</mn></mrow>" +
	  						"</mfence>" +
  						"</math>" +
  				"</line></root>");
  				
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild;
  				model.anchor.offset = 1;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfence", offset: 1});
  				model.moveRight();
  				t.is("/root/line[1]/math[1]/mfence[2]/mrow[1]/mn[1]", model.getPath());
				var node = model.getFocusNode();
				t.is("mn", node.nodeName);
				t.is(0, model.getOffset());
				t.is("123", node.textContent);
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "右移进括号，括号前有一个layout节点，从layout后右移进括号内的第一个节点，第一个节点是layout节点",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.mode = "mathml";
  				model.loadData("<root><line>" +
  						"<math>" +
  							"<mfence><mrow><mn>12</mn></mrow></mfence>" +
	  						"<mfence>" +
		  						"<mrow><mfence><mrow><mn>12</mn></mrow></mfence></mrow>" +
	  						"</mfence>" +
  						"</math>" +
  				"</line></root>");
  				
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild;
  				model.anchor.offset = 1;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfence", offset: 1});
  				model.moveRight();
  				t.is("/root/line[1]/math[1]/mfence[2]/mrow[1]/mfence[1]", model.getPath());
				var node = model.getFocusNode();
				t.is("mfence", node.nodeName);
				t.is(0, model.getOffset());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "右移出括号，括号内最后一个节点是token节点",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.mode = "mathml";
  				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mfence>" +
		  						"<mrow><mn>12</mn></mrow>" +
	  						"</mfence>" +
  						"</math>" +
  				"</line></root>");
  				
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild.firstChild.firstChild;
  				model.anchor.offset = 2;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfence", offset: 1});
  				model.path.push({nodeName: "mrow", offset: 1});
  				model.path.push({nodeName: "mn", offset: 1});
  				model.moveRight();
  				t.is("/root/line[1]/math[1]/mfence[1]", model.getPath());
				var node = model.getFocusNode();
				t.is("mfence", node.nodeName);
				t.is(1, model.getOffset());
  			},
  			tearDown: function(){
  				
  			}
	    },{
	    	name: "右移出括号，括号内最后一个节点是layout节点",
  			setUp: function(){
  				this.model = new Model({});
  			},
  			runTest: function(t){
  				var model = this.model;
  				model.mode = "mathml";
  				model.loadData("<root><line>" +
  						"<math>" +
	  						"<mfence>" +
		  						"<mrow><mfence><mrow><mn>12</mn></mrow></mfence></mrow>" +
	  						"</mfence>" +
  						"</math>" +
  				"</line></root>");
  				
  				var line = model.getLineAt(0);
  				model.anchor.node = line.firstChild.firstChild.firstChild.firstChild;
  				model.anchor.offset = 1;
  				model.path = [];model.path.push({nodeName: "root"});
  				model.path.push({nodeName: "line", offset: 1});
  				model.path.push({nodeName: "math", offset: 1});
  				model.path.push({nodeName: "mfence", offset: 1});
  				model.path.push({nodeName: "mrow", offset: 1});
  				model.path.push({nodeName: "mfence", offset: 1});
  				model.moveRight();
  				t.is("/root/line[1]/math[1]/mfence[1]", model.getPath());
				var node = model.getFocusNode();
				t.is("mfence", node.nodeName);
				t.is(1, model.getOffset());
  			},
  			tearDown: function(){
  				
  			}
	    }
	                             
	]);
});