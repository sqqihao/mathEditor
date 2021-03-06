define([ "intern!tdd", 
         "intern/chai!assert", 
         "mathEditor/Model", 
         "mathEditor/lang" ], function(
        		 tdd,
        		 assert, 
        		 Model, 
        		 dripLang) {

	with(tdd){
		suite("Model.setData.tab 插入制表符", function(){
			
			var model = null;
			beforeEach(function () {
				model = new Model({});
			});
			
			test("在空的model中，敲击tab键盘之后插入制表符号，使用\\t表示制表符，keyCode为9", function(){
				model.setData({data:"\t"});
				// 制表符在model中用什么节点表示呢， 制表符用4个空格表示，还是8个空格？
				// 在model中直接用\t表示，但是在界面上进行绘制的时候，需要使用span节点封装。
				// 并在其中放置指定个数的空格。
				
				// 暂不支持在math模式下输入制表符号
				assert.equal("/root/line[1]/text[1]", model.getPath());
				assert.equal(model.getFocusNode().nodeName,"text");
				assert.equal(1,model.getOffset()); // 在model中任何用转移符号表示的字符的长度都为1
				// 判断插入的值
				// 如果浏览器支持css3的tab-size，则值为\\tab,(否则插入四个&nbsp;暂不实现这个功能)
				assert.equal("\t",dripLang.getText(model.getFocusNode()));
			});
			
			test("在空的model中输入字母，然后输入tab键，再输入字母", function(){
				model.setData({data:"a"});
				model.setData({data:"\t"});
				// 暂不支持在math模式下输入制表符号
				assert.equal("/root/line[1]/text[1]", model.getPath());
				assert.equal(model.getFocusNode().nodeName,"text");
				assert.equal(2,model.getOffset());
				// 判断插入的值
				assert.equal("a\t",dripLang.getText(model.getFocusNode()));
			});
		});
	}
	
});