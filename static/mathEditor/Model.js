define([ "dojo/_base/declare",
         "dojo/_base/lang",
         "dojo/_base/array",
         "dojo/dom-construct",
         "dojox/xml/parser",
         "mathEditor/string",
         "mathEditor/dataUtil",
         "mathEditor/lang",
         "mathEditor/xmlUtil"], function(
        		 declare,
        		 lang,
        		 array,
        		 domConstruct,
        		 xmlParser,
        		 dripString,
        		 dataUtil,
        		 dripLang,
        		 xmlUtil) {
	var EMPTY_XML = "<root><line></line></root>";
	
	var STRING_FUNCTION_APPLICATION = dripLang.STRING_FUNCTION_APPLICATION;
	
	var layoutOffset = {before:0, after:1, select:2 /*当前节点处于选中状态*/};
	
	return declare(null,{
		// summary:
		//		遇到layout节点，删除时，删掉整个layout节点，不给高亮提示；移动时，要往layout内部移动。
		
		
		
		// summary:
		//		存储当前聚焦点的完整路径
		// nodeName:
		//		节点名称
		// offset:
		//		节点在父节点中的位置，从1开始计数。
		path: null,
		xmlString: null,
		doc: null,
		
		// mode： 输入模式
		//		表示编辑器的输入模式，默认是“text”，输入公式的模式是"mathml",
		//		目前支持这两种模式。
		//		模式之间的切换：
		//		text-->mathml 
		//			使用Alt+"="
		//			如果用户输入的字符是公式专用的，则智能切换到mathml模式
		//		mathml --> text 强制使用Alt+"="，则光标跳到公式外面
		//						或者用户移动光标，移到公式外面。
		mode: "text",
		
		
		// summary:
		//		一个在文本内容间浮动的锚，用来定位当前的输入点。
		// node:
		//		光标所在的节点。
		//		节点分三种类型：
		//		1. 一种是token节点，里面放置文本内容；
		//		2. 一种是layout节点，用来布局token节点；
		//		3. 一种是line节点，表示行。
		// offset：
		//		offset的值，根据三种类型，各有不同的计算逻辑。
		//		1. 如果是token节点，offset指光标在node节点中文本的偏移量；
		//		2. 如果是layout节点，offset只有两个值，0表示在node之前，1表示在node之后，2表示在node内部（或是node处于选中状态）；
		//		3. 如果是line节点，则offset的值永远为0。
		//
		//		layout节点本来应该遵循与token节点相同的方式，但是那样就多饶了一道，还需要计算出实际获取焦点的节点。
		//		layout节点，除了mathml中的layout节点，也包括math节点。
		//		TODO：考虑是否需要再添加一个type属性，来标识node的类型：token和layout
		//node: null, offset: -1
		anchor: null,
		
		// 当前节点在xml文件中的具体路径
		
		
		// 调用顺序
		//		如果是新建，则直接new即可
		//		如果已存在内容，则先新建，然后通过loadData，加载内容
		//		因为包含普通文本和math文本，使用span包含普通文本
		//		<root><line><text></text><math></math></line></root>
		//		在构造函数中初始化到位，如果有传入xml文本，则读取文本进行初始化；
		//		如果什么也没有传，则初始化为默认值。
		constructor: function(options){
			this._init();
			lang.mixin(this, options);
		},
		
		_init: function(data){
			// 注意：在类中列出的属性，都必须在这里进行初始化。
			var xmlData = data;
			if(!xmlData || xmlData == ""){
				xmlData = EMPTY_XML;
			}
			this.doc = xmlParser.parse(xmlData);
			this.path = [];
			this.anchor = {};
			this.mode = "text";

			this.path.push({nodeName:"root"});
			this.path.push({nodeName:"line", offset:1});
			
			// 光标默认放在第一行起始位置
			var firstLine = this.doc.documentElement.firstChild;
			if(dripLang.getChildLength(firstLine) == 0){
				this.anchor.node = firstLine;
			}else{
				var firstChild = firstLine.firstChild;
				this.anchor.node = firstChild;
				this.path.push({nodeName: firstChild.nodeName, offset:1})
			}
			this.anchor.offset = 0;
		},
		
		clear: function(){
			this._init();
			this.onChanged();
		},
		
		// 如果没有内容，则创建一个新行
		// 如果存在内容，则加载内容，并将光标移到最后
		loadData: function(xmlString){
			// summary:
			//		加载数据，加载完数据之后就刷新页面，因为此时数据确实改变了。
			//		遵循同样的逻辑，处理要一致的原则
			this._init(xmlString);
			this.onChanged();
		},
		
		isTextMode: function(){
			return this.mode === "text";
		},
		
		isMathMLMode: function(){
			return this.mode === "mathml";
		},
		
		switchMode: function(){
			// summary:
			//		在text模式和mathml模式之间切换
			if(this.isTextMode()){
				this.toMathMLMode();
			}else if(this.isMathMLMode()){
				this.toTextMode();
			}
		},
		
		// TODO:将为私有函数，需要修改测试用例中的调用代码
		toTextMode: function(){
			this.mode = "text";
			
			var nodeName = this.anchor.node.nodeName;
			if(nodeName != "line" && nodeName != "text"){
				this.anchor = this.mathMLToTextMode(this.anchor);
			}
		},
		// TODO:将为私有函数，需要修改测试用例中的调用代码
		toMathMLMode: function(){
			// summary:
			//		新插入节点的逻辑：
			//		在line节点里；如果offset为0，则在text节点前，如果0<offset<contentLength，则在text中；
			//		如果offset==contentLength,则在text节点后，加入一个空的math节点。
			
			this.mode = "mathml";
			
			var nodeName = this.anchor.node.nodeName;
			if(nodeName == "line" || nodeName == "text"){
				this.anchor = this.textToMathMLMode(this.anchor, "math");
			}
		},
		
		mathMLToTextMode: function(anchor){
			var node = anchor.node;
			var offset = anchor.offset;
			
			if(node.nodeName === "math" && node.childNodes.length == 0){
				// 删除math
				var parentNode = node.parentNode;
				var focusNode = null;
				if(parentNode.childNodes.length == 1){
					this.path.pop();
					focusNode = parentNode;
					offset = 0;
				}else if(node.previousSibling){
					var prev = node.previousSibling;
					focusNode = prev;
					if(this._isTokenNode(prev.nodeName)){
						offset = this._getTextLength(prev);
					}else{
						offset = 1;
					}
					this._movePathToPreviousSibling(prev);
				}else if(node.nextSibling){
					var pos = this.path.pop();
					var next = node.nextSibling;
					focusNode = next
					offset = 0;
					pos.nodeName = next.nodeName;
					this.path.push(pos);
				}
				parentNode.removeChild(node);
				return {node: focusNode, offset: offset};
			}

			var mathNode = node;
			while(mathNode.nodeName != "math"){
				mathNode = mathNode.parentNode;
				this.path.pop();
			}
			return {node: mathNode, offset:1};
		},
		
		textToMathMLMode: function(anchor, nodeName){
			// summary:
			//		从text模式切换到mathml模式。当切换完成之后，当前获取焦点的节点就不再可能是text和line。
			//		最外围的就是math节点。
			
			var node = anchor.node;
			var offset = anchor.offset;
			var xmlDoc = this.doc;
			
			if(this._isLineNode(node)){
				// 如果在line节点下，则先切换到math节点下。
				var mathNode = xmlDoc.createElement("math");
				node.appendChild(mathNode);
				this.path.push({nodeName:"math", offset:1});
				node = mathNode;
				offset = layoutOffset.select;
			}else if(this._isTextNode(node)){
				// FIXME:调通代码，并添加更多的测试用例
				this._splitNodeIfNeed(nodeName);
				
				var mathNode = xmlDoc.createElement("math");
				var pathOffset = 0;// 分为pathOffset和focusOffset
				
				var pos = this.path.pop();
				if(offset > 0){
					pathOffset = pos.offset + 1;
					dripLang.insertNodeAfter(mathNode, node);
				}else{
					// 如果等于0，则放在节点之前
					pathOffset = pos.offset;
					dripLang.insertNodeBefore(mathNode, node);
				}
				this.path.push({nodeName: "math", offset: pathOffset});
				node = mathNode;
				offset = layoutOffset.select;
			}
			return {node: node, offset: offset};
		},
		
		
		_split: function(text){
			return text.split(/\r\n|\r|\n/);
		},
		
		_splitNodeByNewLine: function(focusNode, offset, firstLine, lastLine){
			var beforeNode=null,afterNode=null;
			var xmlDoc = this.doc;
			var textLen = dripLang.getText(focusNode).length;
			if(offset == 0){
				var previousNode = focusNode.previousSibling;
				if(!previousNode || previousNode.nodeName != "text"){
					beforeNode = xmlDoc.createElement("text");
					dripLang.setText(beforeNode, firstLine);
					dripLang.insertNodeBefore(beforeNode, focusNode);
					afterNode = focusNode;
				}else{
					dripLang.appendTextEnd(previousNode, firstLine);
					beforeNode = previousNode;
					afterNode = focusNode;
				}
				
				if(lastLine && lastLine != ""){
					dripLang.appendTextStart(afterNode, lastLine);
				}
			}else if(offset == textLen){
				var nextNode = focusNode.nextSibling;
				if(!nextNode || nextNode.nodeName != "text"){
					beforeNode = focusNode;
					dripLang.appendTextEnd(beforeNode, firstLine);
					
					if(lastLine.length > 0){
						afterNode = xmlDoc.createElement("text");
						dripLang.setText(afterNode, lastLine)
						dripLang.insertNodeAfter(afterNode, focusNode);
					}
				}else{
					dripLang.appendTextEnd(focusNode, firstLine);
					beforeNode = focusNode;
					afterNode = nextNode;
					dripLang.appendTextStart(afterNode, lastLine);
				}
			}else if(0 < offset && offset < textLen){
				var oldText = dripLang.getText(focusNode);
				dripLang.setText(focusNode, oldText.substring(0, offset)+firstLine);
				beforeNode = focusNode;
				afterNode = xmlDoc.createElement("text");
				dripLang.setText(afterNode, lastLine + oldText.substring(offset));
				dripLang.insertNodeAfter(afterNode, focusNode);
			}
			return {beforeNode: beforeNode, afterNode: afterNode};
		},
		
		insertText: function(anchor, text){
			// summary:
			//		插入普通文本，用于text模式下。
			// anchor: Object {node:node, offset:offset}
			//		光标的位置
			// text: String
			//		插入的文本
			// returns：
			//		返回新的anchor
			// TODO:逐步重构这个方法，先实现添加单个字符，然后再实现添加多行字符，然后重构
			
			if(!text || text.length == 0){
				return anchor;
			}
			
			var node = anchor.node;
			var offset = anchor.offset;
			var xmlDoc = this.doc;
			// 第一行和最后一行需要特殊处理，中间的行数全部使用line节点添加在两者中间即可，没有其他处理逻辑。
			var lines = this._split(text);
			
			if(lines.length == 1){
				var line = lines[0];
				if(this._isLineNode(node)){
					var nodeName = "text";
					var newNode = xmlDoc.createElement(nodeName);
					node.appendChild(newNode);
					node = newNode;
					this.path.push({nodeName: nodeName, offset: 1});
				}
				
				var oldText = dripLang.getText(node);
				var newText = dripString.insertAtOffset(oldText, offset, line);
				dripLang.setText(node, newText);
				
				offset += line.length;
				return {node: node, offset: offset};
			}
			
			// 从lines中移除第一行，第一行代码需要与光标前面的代码对接
			var firstLine = lines.splice(0,1)[0];
			// 从lines中移除最后一行，最后一行代码需要与光标后面的代码对接
			var lastLine = lines.splice(lines.length-1, lines.length)[0];

			// 为beforeNode追加值，将afterNode及其后面的节点都挪到最后一行。
			var beforeNode = null, afterNode = null, lastLineNode = null;
			
			// 因为需要跳转行，所以先给出光标所在行，这样中间就不用反复设置path了。
			
			var pos = null;
			var lineCount = 0;
			if(this._isLineNode(node)){
				pos = this.path.pop();
			}else if(this._isTextNode(node)){
				this.path.pop();
				pos = this.path.pop();
			}
			
			if(firstLine.length == 0){
				if(this._isLineNode(node)){
					// beforeNode和afterNode都为null
					
					if(lastLine && lastLine != ""){
						afterNode = xmlDoc.createElement("text");
						dripLang.setText(afterNode, lastLine);
						node.appendChild(afterNode);
					}
				}else{
					var splitNode = this._splitNodeByNewLine(node, offset, firstLine, lastLine);
					beforeNode = splitNode.beforeNode;
					afterNode = splitNode.afterNode;
				}
			}else if(firstLine.length > 0){
				if(this._isLineNode(node)){
					var nodeName = "text";
					var newNode = xmlDoc.createElement(nodeName);
					dripLang.setText(newNode, firstLine);
					
					node.appendChild(newNode);
					
					beforeNode = newNode;
					afterNode = newNode.nextSibling
					
					if(lastLine && lastLine != ""){
						if(!afterNode){
							afterNode = xmlDoc.createElement("text");
							dripLang.insertNodeAfter(afterNode, beforeNode);
						}
						dripLang.appendTextStart(afterNode, lastLine);
					}
					
				}else{
					var splitNode = this._splitNodeByNewLine(node, offset, firstLine, lastLine);
					beforeNode = splitNode.beforeNode;
					afterNode = splitNode.afterNode;
				}
			}
			
			
			lineCount = lines.length+1;
			var nodeName = "line";
			var focusedLine = this._getFocusLine();
			
			// 插入中间行
			var traceLine = focusedLine;
			if(lines.length > 0){
				array.forEach(lines, function(line){
					var newLineNode = xmlDoc.createElement(nodeName);
					dripLang.setText(newLineNode, line);
					
					dripLang.insertNodeAfter(newLineNode, traceLine);
					traceLine = newLineNode;
				});
			}
			
			// 插入最后一行
			var nodeName = "line";
			lastLineNode = xmlDoc.createElement(nodeName);
			dripLang.insertNodeAfter(lastLineNode, traceLine);
			if(afterNode){
				var nextNode = afterNode;
				do{
					lastLineNode.appendChild(nextNode);
				}while(nextNode = nextNode.nextSibling);
			}
			
			if(afterNode){
				this.path.push({nodeName:"line", offset:pos.offset+lineCount});
				this.path.push({nodeName:"text", offset:1});
				node = afterNode;
				offset = lastLine.length;
			}else{
				this.path.push({nodeName:"line", offset:pos.offset+lineCount});
				node = lastLineNode;
				offset = 0;
			}

			return {node:node, offset:offset};
		},
		
		findTrigonometric: function(anchor, miContext){
			// summary:
			//		如果preMis的长度为1，则再往后找一位,往前找一位，往后找一位,往后找两位.
			
			var preMis = [];
			var nextMis = [];
			var functionName = null;
			
			var node = anchor.node;
			var preNode = node;
			var nodeName = "mi";
			
			// 往前找两位
			while(preNode && preNode.nodeName == nodeName && dripLang.getText(preNode).length == 1){
				preMis.unshift(dripLang.getText(preNode));
				preNode = node.previousSibling;
				if(preMis.length == 2){
					break;
				}
			}
			if(preMis.length == 2){
				var text = preMis.join("")+miContext;
				if(dripLang.isTrigonometric(text)){
					return {functionName: text, preMis: preMis, nextMis: nextMis};
				}
			}else if(preMis.length == 1){
				var nextNode = node.nextSibling;
				if(nextNode && nextNode.nodeName == nodeName && dripLang.getText(nextNode).length == 1){
					var nextMi = dripLang.getText(nextNode);
					var text = preMis[0]+miContext+nextMi;
					if(dripLang.isTrigonometric(text)){
						return {functionName: text, preMis: preMis, nextMis: nextMis};
					}
				}
			}else if(preMis.length == 0){
				var nextNode = node.nextSibling;
				var nextMis = [];
				while(nextNode && nextNode.nodeName == nodeName && dripLang.getText(nextNode).length == 1){
					nextMis.push(dripLang.getText(nextNode));
					nextNode = nextNode.nextSibling;
					if(nextMis.length == 2){
						break;
					}
				}
				if(nextMis.length == 2){
					var text = miContext + nextMis.join("");
					if(dripLang.isTrigonometric(text)){
						return {functionName: text, preMis: preMis, nextMis: nextMis};
					}
				}
			}
			return null;
		},
		
		removeExistTrigonometricPart: function(anchor, tri){
			var node = anchor.node;
			var offset = anchor.offset;
			var preLength = tri.preMis.length;
			if(preLength == 2){
				var willFocusNode = node.previousSibling.previousSibling;
				
				if(willFocusNode){
					var pos = this.path.pop();
					pos.offset-=2;
					this.path.push(pos);
				}else{
					willFocusNode = node.parentNode;
					var pos = this.path.pop();
				}
				node.parentNode.removeChild(node.previousSibling);
				node.parentNode.removeChild(node);
				
				
				
				node = willFocusNode;
				if(dripLang.isMathLayoutNode(node)){
					offset = layoutOffset.select;
				}
				else if(node.nodeName == "mi" || node.nodeName == "mo"){
					offset = 1;
				}else{
					offset = dripLang.getText(node).length;
				}
			}else if(preLength == 1){
				// 此时，nextMis.length == 2
				var willFocusNode = node.previousSibling
				node.parentNode.removeChild(node.nextSibling);
				node.parentNode.removeChild(node);
				
				var pos = this.path.pop();
				pos.offset--;
				this.path.push(pos);
				
				node = willFocusNode;
				if(node.nodeName == "mi" || node.nodeName == "mo"){
					offset = 1;
				}else{
					offset = dripLang.getText(node).length;
				}
			}else if(preLength == 0){
				// 删除前面的字符
				node.parentNode.removeChild(node.nextSibling);
				node.parentNode.removeChild(node.nextSibling);
				
				// 不对path做任何处理
				
				if(node.nodeName == "mi" || node.nodeName == "mo"){
					offset = 1;
				}else{
					offset = dripLang.getText(node).length;
				}
			}
			
			return {node:node, offset:offset};
		},
		
		insertMi: function(anchor, miContent, nodeName){
			// 这里只处理单个英文字母的情况
			// 注意如果获取焦点的节点是mi节点，则offset的值要么是0， 要么是1，
			// 分别代表在mi的前或后
			
			// 通常一个完整的mi类型的字符占用一个mi
			
			var node = anchor.node;
			var offset = anchor.offset;
			var xmlDoc = this.doc;
			
			// 还是将token节点和layout节点分开来处理，会更容易理解一些。
			if(node.nodeName === "math" || node.nodeName === "mrow" || dripLang.isMathLayoutNode(node)){
				if(offset === layoutOffset.before){
					return this._insertNewTokenNodeBefore(nodeName, miContent, node);
				}
				
				if(offset === layoutOffset.after){
					return this._insertNewTokenNodeAfter(nodeName, miContent, node);
				}
				
				if(offset === layoutOffset.select){
					var newNode = xmlDoc.createElement(nodeName);
					dripLang.setText(newNode, miContent);
					
					node.appendChild(newNode);
					this.path.push({nodeName:nodeName, offset:1});
					node = newNode;
					offset = 1; // mi的offset要么是1，要么是0
					return {node:node, offset:offset};
				}
			}
			
			// 剩下的就是token类型的节点了。
			if(offset == 0){
				return this._insertNewTokenNodeBefore(nodeName, miContent, node);
			}else if(offset == this._getTextLength(node)){
				return this._insertNewTokenNodeAfter(nodeName, miContent, node);
			}else{
				// 中间
				this._splitNodeIfNeed(nodeName);
				return this._insertNewTokenNodeAfter(nodeName, miContent, node);
			}
			
			return {node:node, offset:offset};
			
		},
		
		insertMo: function(anchor, moContent, nodeName){
			var node = anchor.node;
			var offset = anchor.offset;
			var xmlDoc = this.doc;

			if(node.nodeName === "math" || node.nodeName === "msqrt"){
				// FIXME:是否需要根据offset定位插入点呢？等写了相应的测试用例之后，再添加这个逻辑
				//console.error("测试这段代码有没有被执行过");
				var newNode = xmlDoc.createElement(nodeName);
				dripLang.setText(newNode, moContent);
				
				node.appendChild(newNode);
				this.path.push({nodeName:nodeName, offset:1});
				node = newNode;
				offset = 1; // 操作符号的offset要么是1，要么是0
			}else{
				// 所有的操作符，都是一个单独的符号，用一个mo封装。
				if(moContent == "=" && node.nodeName == "mo" && dripLang.getText(node) == "="){
					dripLang.appendTextEnd(node, "=");
				}else if(moContent == "=" && node.nodeName == "mo" && dripLang.getText(node) == "!"){
					dripLang.appendTextEnd(node, "=");
				}else{
					if(offset == 0){
						// 放在节点前面
						return this._insertNewTokenNodeBefore(nodeName, moContent, node);
					}else{
						// mn中的内容是可以拆分的。mi和mo的最大长度总是为1，所以不专门处理offset==length的情况，因为都是追加
						if(node.nodeName === "mn" && 0 < offset && offset < this._getTextLength(node)){
							// 如果是可拆分的节点
							this._splitNodeIfNeed(nodeName);
						}
						var newNode = xmlDoc.createElement(nodeName);
						dripLang.setText(newNode, moContent);
						
						var mstyleNode = node.parentNode;
						if(this._isMstyleAndHasOneChild(mstyleNode)){
							dripLang.insertNodeAfter(newNode,mstyleNode);
						}else{
							dripLang.insertNodeAfter(newNode,node);
						}
						
						
						node = newNode;
						offset = 1;
						
						var pos = this.path.pop();
						this.path.push({nodeName:nodeName, offset:pos.offset+1});
					}
				}
			}
			
			return {node: node, offset: offset};
		},
		
		_isMstyleAndHasOneChild: function(node /*mstyle*/){
			return node.nodeName === "mstyle" && dripLang.getChildLength(node) === 1;
		},
		
		insertMn: function(anchor, mnContent, nodeName){
			// 按照以下思路重构。
			// 添加一个数据，分以下几步：
			//		如果指定了nodeName，则直接使用；如果没有指定，则先推导
			//		比较要输入的值和当前输入的环境
			//		确定可以执行哪些动作
			//		新建节点
			//		设置当前节点，将anchor改为context
			//		在新节点中插入内容
			//		修正当前的path值
			
			var node = anchor.node;
			var offset = anchor.offset;
			var xmlDoc = this.doc;
			
			// FIXME: 将所有mathml方法中的对line和text的切换提取到公共一个单独方法中，不要放在每个insert方法中。
			// 等提交的时候，把这段文字作为注释输入。
			
			// FIXME: 在进入mathml模式时，应该不再在line和text节点中。
			// 暂时先放在这里处理，但是这里的逻辑还是添加一个math节点。
			
			// 还是将token节点和layout节点分开来处理，会更容易理解一些。
			if(node.nodeName === "math" || node.nodeName === "mrow" || dripLang.isMathLayoutNode(node)){
				if(offset === layoutOffset.before){
					var prev = node.previousSibling;
					if(prev && prev.nodeName === "mn"){
						// path和anchor保持不变
						// 修改prev中的值
						dripLang.appendTextEnd(prev, mnContent);
					}else{
						// 在node前插入一个mn节点
						return this._insertNewTokenNodeBefore(nodeName, mnContent, node);
					}
					return {node:node, offset:offset};
				}
				
				if(offset === layoutOffset.after){
					// path和anchor保持不变
					// 修改prev中的值
					var next = node.nextSibling;
					if(next && next.nodeName === "mn"){
						dripLang.appendTextStart(next, mnContent)
						
					}else{
						// 在node后追加一个mn节点
						return this._insertNewTokenNodeAfter("mn", mnContent, node);
					}
					return {node:node, offset:offset};
				}
				
				if(offset === layoutOffset.select){
					var newNode = xmlDoc.createElement(nodeName);
					dripLang.setText(newNode, mnContent);
					
					node.appendChild(newNode);
					this.path.push({nodeName:nodeName, offset:1});
					node = newNode;
					offset = mnContent.length;
					return {node:node, offset:offset};
				}
			}
			
			// 剩下的就是token类型的节点了。
			// 唯一特殊的就是mn节点了，可以在mn前或后面追加数字
			if(node.nodeName === "mn"){
				var oldText = dripLang.getText(node);
				dripLang.setText(node, dripString.insertAtOffset(oldText, offset, mnContent));
				
				offset += mnContent.length;
				return {node:node, offset:offset};
			}
			
			if(offset == 0){
				var prev = node.previousSibling;
				if(prev && prev.nodeName === "mn"){
					// path和anchor保持不变
					// 修改prev中的值
					dripLang.appendTextEnd(prev, mnContent);
				}else{
					// 在node前插入一个mn节点
					return this._insertNewTokenNodeBefore(nodeName, mnContent, node);
				}
			}else{
				var next = node.nextSibling;
				if(next && next.nodeName === "mn"){
					dripLang.appendTextStart(next, mnContent);
				}else{
					// 在node后追加一个mn节点
					return this._insertNewTokenNodeAfter("mn", mnContent, node);
				}
			}
			return {node:node, offset:offset};
		},
		
		_insertNewTokenNodeAfter: function(newNodeName, content,existNode){
			var tokenNode = this.doc.createElement(newNodeName);
			dripLang.setText(tokenNode, content);
			
			var mstyleNode = existNode.parentNode;
			if(this._isMstyleAndHasOneChild(mstyleNode)){
				dripLang.insertNodeAfter(tokenNode, mstyleNode);
			}else{
				dripLang.insertNodeAfter(tokenNode, existNode);
			}
			
			var pos = this.path.pop();
			this.path.push({nodeName:newNodeName, offset:pos.offset+1});
			
			node = tokenNode;
			if(newNodeName === "mn"){
				offset = content.length;
			}else{
				offset = 1;
			}
			
			return {node:node, offset:offset};
		},
		
		_insertNewTokenNodeBefore:  function(nodeName, content,existNode){
			var tokenNode = this.doc.createElement(nodeName);
			dripLang.setText(tokenNode, content);
			
			var mstyleNode = existNode.parentNode;
			if(this._isMstyleAndHasOneChild(mstyleNode)){
				dripLang.insertNodeBefore(tokenNode, mstyleNode);
			}else{
				dripLang.insertNodeBefore(tokenNode, existNode);
			}
			
			var pos = this.path.pop();
			pos.offset++// nodeName保持不变
			this.path.push(pos);
			
			// anchor保持不变
			return this.anchor;
		},
		
		insertFenced: function(anchor, fencedContent, nodeName){
			/*
			 * <mfenced open="[" close="}" separators="sep#1 sep#2 ... sep#(n-1)">
			 * <mrow><mi>x</mi></mrow>
			 * <mrow><mi>y</mi></mrow>
			 * </mfenced>
			 */
			var node = anchor.node;
			var offset = anchor.offset;
			var xmlDoc = this.doc;
			
			if(node.nodeName == "math"){
				this.path.push({nodeName:nodeName, offset:1});
				this.path.push({nodeName:"mrow", offset:1});
				this.path.push({nodeName:"mn", offset:1});
				var mfenced = xmlUtil.createEmptyMfenced(xmlDoc, fencedContent)
				node.appendChild(mfenced.rootNode);
				node = mfenced.focusNode;
				offset = 0;
				return {node: node, offset: offset};
			}
			
			// 在节点后插入mfenced
			if(this._isMathMLNodeEnd(node, offset)){
				var pos = this.path.pop();
				pos.offset++;
				pos.nodeName = nodeName;
				this.path.push(pos);
				this.path.push({nodeName:"mrow", offset:1});
				this.path.push({nodeName:"mn", offset:1});
				
				var mfenced = xmlUtil.createEmptyMfenced(xmlDoc, fencedContent)
				
				var mstyleNode = node.parentNode;
				if(this._isMstyleAndHasOneChild(mstyleNode)){
					dripLang.insertNodeAfter(mfenced.rootNode, mstyleNode);
				}else{
					dripLang.insertNodeAfter(mfenced.rootNode, node);
				}
				// 因为是占位符
				node = mfenced.focusNode;
				offset = 0;
				
				return {node: node, offset:offset};
			}

			// 在节点前插入mfenced
			if(this._isMathMLNodeStart(node, offset)){
				var pos = this.path.pop();
				// pos.offset保持不变
				pos.nodeName = nodeName;
				this.path.push(pos);
				this.path.push({nodeName:"mrow", offset:1});
				this.path.push({nodeName:"mn", offset:1});
				
				var mfenced = xmlUtil.createEmptyMfenced(xmlDoc, fencedContent)
				var mstyleNode = node.parentNode;
				if(this._isMstyleAndHasOneChild(mstyleNode)){
					dripLang.insertNodeBefore(mfenced.rootNode, mstyleNode);
				}else{
					dripLang.insertNodeBefore(mfenced.rootNode, node);
				}
				node = mfenced.focusNode;
				offset = 0;
				return {node: node, offset:offset};
			}
			
		},
		
		insertTrigonometric: function(anchor, data, nodeName){
			var node = anchor.node;
			var offset = anchor.offset;
			var xmlDoc = this.doc;
			
			if(node.nodeName === "math"){
				this.path.push({nodeName:"mrow", offset:3});
				this.path.push({nodeName:"mn", offset:1});
				
				var mi = xmlDoc.createElement(nodeName);
				var mo = xmlDoc.createElement("mo");
				var mrow = xmlDoc.createElement("mrow");
				var placeHolder = xmlUtil.getPlaceHolder(xmlDoc);
				
				dripLang.setText(mi, data);
				dripLang.setText(mo, STRING_FUNCTION_APPLICATION);
				
				mrow.appendChild(placeHolder);
				
				node.appendChild(mi);
				node.appendChild(mo);
				node.appendChild(mrow);
				
				node = placeHolder;
				offset = 0;
			}else{
				var pos = this.path.pop();
				this.path.push({nodeName:"mrow", offset:pos.offset + 3});
				this.path.push({nodeName:"mn", offset:1});
				
				var mi = xmlDoc.createElement(nodeName);
				var mo = xmlDoc.createElement("mo");
				var mrow = xmlDoc.createElement("mrow");
				var placeHolder = xmlUtil.getPlaceHolder(xmlDoc);
				
				dripLang.setText(mi, data);
				dripLang.setText(mo, STRING_FUNCTION_APPLICATION);
				mrow.appendChild(placeHolder);

				dripLang.insertNodeAfter(mi, node);
				dripLang.insertNodeAfter(mo, mi);
				dripLang.insertNodeAfter(mrow, mo);
				
				node = placeHolder;
				offset = 0;
			}
			return {node: node, offset:offset};
		},
		
		insertInferredMfrac: function(anchor, data, nodeName){
			// summary:
			//		输入推断的分数，往前寻找光标前的节点，直到遇到操作符，将这些作为分数的分子，然后光标落在空的分母上
			//		TODO:放在0.0.2版本中完善，0.0.1版本暂不支持
			var node = anchor.node;
			var offset = anchor.offset;
			
			// FIXME: 重构，这段代码有重复的地方
			var xmlDoc = this.doc;
			
			
			if(node.nodeName === "math"){
				this.path.push({nodeName:"mfrac", offset:1});
				this.path.push({nodeName:"mrow", offset:1});
				this.path.push({nodeName:"mn", offset:1});
				
				var fracData = xmlUtil.createEmptyFrac(xmlDoc);
				node.appendChild(fracData.rootNode);
				
				node = fracData.focusNode;
				offset = 0;
			}else{
				// FIXME：需要推断，前面那些组合可以做分子
				// 在数学公式中
				//		1.将当前的math节点从原有的父节点中移除
				//		2.创建一个mfrac
				//		3.将刚才移除的节点作为mfrac的分子
				//		4.将焦点放在分母上
				/**
  				 * <pre>
  				 * FROM
  				 * <math>
  				 * 	<mn>1</mn>
  				 * </math>
  				 *   TO
  				 * <math>
  				 * 	<mfrac>
  				 *    <mrow><mn>1</mn></mrow>
  				 *    <mrow><mn></mn></mrow>
  				 *  <mfrac>
  				 * </math>
  				 * </pre>
  				 */
				var newOffset = 1;
				var position = "last";
				
				this.path.pop();
				this.path.push({nodeName:"mfrac", offset:newOffset});// 替换刚才节点的位置
				this.path.push({nodeName:"mrow", offset:2});
				this.path.push({nodeName:"mn", offset:1});
				
				
				
				var parent = node.parentNode;
				position = newOffset - 1; // FIXME：为什么是0呢？
				// node为当前获取焦点的节点，该节点将作为mfrac的分子节点
				var fracData = xmlUtil.createFracWithNumerator(xmlDoc, node);
				domConstruct.place(fracData.rootNode, parent, position);
				
				node = fracData.focusNode;
				offset = 0;
			}
			return {node: node, offset: offset};
		},
		
		insertMfrac: function(anchor, data, nodeName){
			var node = anchor.node;
			var offset = anchor.offset;
			var xmlDoc = this.doc;
			
			var nodeName = node.nodeName;
			if(nodeName === "math" && offset === layoutOffset.select){
				this.path.push({nodeName:"mfrac", offset:1});
				this.path.push({nodeName:"mrow", offset:1});
				this.path.push({nodeName:"mn", offset:1});
				
				var fracData = xmlUtil.createEmptyFrac(xmlDoc);
				node.appendChild(fracData.rootNode);
				
				node = fracData.focusNode;
				offset = 0;
				return {node: node, offset:offset};
			}

			// 在节点后插入分数
			if(this._isMathMLNodeEnd(node, offset)){
				var pos = this.path.pop();
				pos.offset++;
				pos.nodeName = "mfrac";
				this.path.push(pos);
				this.path.push({nodeName:"mrow", offset:1});
				this.path.push({nodeName:"mn", offset:1});
				
				var fracData = xmlUtil.createEmptyFrac(xmlDoc);
				
				var mstyleNode = node.parentNode;
				if(this._isMstyleAndHasOneChild(mstyleNode)){
					dripLang.insertNodeAfter(fracData.rootNode, mstyleNode);
				}else{
					dripLang.insertNodeAfter(fracData.rootNode, node);
				}
				// 因为是占位符
				node = fracData.focusNode;
				offset = 0;
				
				return {node: node, offset:offset};
			}
			
			// 在节点前插入分数
			if(this._isMathMLNodeStart(node, offset)){
				var pos = this.path.pop();
				// pos.offset保持不变
				pos.nodeName = "mfrac";
				this.path.push(pos);
				this.path.push({nodeName:"mrow", offset:1});
				this.path.push({nodeName:"mn", offset:1});
				
				var fracData = xmlUtil.createEmptyFrac(xmlDoc);
				var mstyleNode = node.parentNode;
				if(this._isMstyleAndHasOneChild(mstyleNode)){
					dripLang.insertNodeBefore(fracData.rootNode, mstyleNode);
				}else{
					dripLang.insertNodeBefore(fracData.rootNode, node);
				}
				node = fracData.focusNode;
				offset = 0;
				return {node: node, offset:offset};
			}
		},
		
		insertMsqrt: function(anchor, data, nodeName){
			// summary
			//		插入msqrt节点
			//		注意，msqrt中包含一个隐含的mrow节点，所以不需要显式添加mrow节点
			var node = anchor.node;
			var offset = anchor.offset;
			
			var xmlDoc = this.doc;
			
			if(node.nodeName === "math" || node.nodeName === "msqrt" || node.nodeName === "mrow"){
				this.path.push({nodeName:"msqrt", offset:1});
				this.path.push({nodeName:"mn", offset:1});
				
				var sqrtData = xmlUtil.createEmptyMsqrt(xmlDoc);
				node.appendChild(sqrtData.rootNode);

				node = sqrtData.focusNode;
				offset = 0;
				return {node: node, offset: offset};
			}
			
			// 在节点后插入平方根
			if(this._isMathMLNodeEnd(node, offset)){
				var pos = this.path.pop();
				pos.offset++;
				pos.nodeName = "msqrt";
				this.path.push(pos);
				this.path.push({nodeName:"mn", offset:1});
				
				var sqrtData = xmlUtil.createEmptyMsqrt(xmlDoc);
				
				var mstyleNode = node.parentNode;
				if(this._isMstyleAndHasOneChild(mstyleNode)){
					dripLang.insertNodeAfter(sqrtData.rootNode, mstyleNode);
				}else{
					dripLang.insertNodeAfter(sqrtData.rootNode, node);
				}
				
				node = sqrtData.focusNode;
				offset = 0;
				
				return {node: node, offset:offset};
			}

			// 在节点前插入平方根
			if(this._isMathMLNodeStart(node, offset)){
				var pos = this.path.pop();
				// pos.offset保持不变
				pos.nodeName = "msqrt";
				this.path.push(pos);
				this.path.push({nodeName:"mn", offset:1});
				
				var sqrtData = xmlUtil.createEmptyMsqrt(xmlDoc);
				var mstyleNode = node.parentNode;
				if(this._isMstyleAndHasOneChild(mstyleNode)){
					dripLang.insertNodeBefore(sqrtData.rootNode, mstyleNode);
				}else{
					dripLang.insertNodeBefore(sqrtData.rootNode, node);
				}
				node = sqrtData.focusNode;
				offset = 0;
				return {node: node, offset:offset};
			}
		},
		
		insertMroot: function(anchor, data, nodeName){
			// summary:
			//		插入根式，让根次获取焦点
			//		mroot中的base和index都放在显式的mrow下
			var node = anchor.node;
			var offset = anchor.offset;
			
			var xmlDoc = this.doc;
			
			if(node.nodeName === "math"){
				this.path.push({nodeName:"mroot", offset:1});
				this.path.push({nodeName:"mrow", offset:2});
				this.path.push({nodeName:"mn", offset:1});
				
				var rootData = xmlUtil.createEmptyMroot(xmlDoc);
				node.appendChild(rootData.rootNode);

				node = rootData.focusNode;
				offset = 0;
				return {node: node, offset: offset};
			}
			
			// 在节点后插入N次根
			if(this._isMathMLNodeEnd(node, offset)){
				var pos = this.path.pop();
				pos.offset++;
				pos.nodeName = "mroot";
				this.path.push(pos);
				this.path.push({nodeName:"mrow", offset:2});
				this.path.push({nodeName:"mn", offset:1});
				
				var rootData = xmlUtil.createEmptyMroot(xmlDoc);
				
				var mstyleNode = node.parentNode;
				if(this._isMstyleAndHasOneChild(mstyleNode)){
					dripLang.insertNodeAfter(rootData.rootNode, mstyleNode);
				}else{
					dripLang.insertNodeAfter(rootData.rootNode, node);
				}
				
				node = rootData.focusNode;
				offset = 0;
				
				return {node: node, offset:offset};
			}
			// 在节点前插入N次根
			if(this._isMathMLNodeStart(node, offset)){
				var pos = this.path.pop();
				// pos.offset保持不变
				pos.nodeName = "mroot";
				this.path.push(pos);
				this.path.push({nodeName:"mrow", offset:2});
				this.path.push({nodeName:"mn", offset:1});
				
				var rootData = xmlUtil.createEmptyMroot(xmlDoc);
				var mstyleNode = node.parentNode;
				if(this._isMstyleAndHasOneChild(mstyleNode)){
					dripLang.insertNodeBefore(rootData.rootNode, mstyleNode);
				}else{
					dripLang.insertNodeBefore(rootData.rootNode, node);
				}
				node = rootData.focusNode;
				offset = 0;
				return {node: node, offset:offset};
			}
		},
		
		insertScripting: function(anchor, data, nodeName){
			// summary:
			//		插入上下标, 插入上下标的逻辑为：
			//		永远只把index节点前的一个节点作为base节点
			//		用户输入方式：输入上下标的时候，不弹出推荐框，而是直接应用
			var node = anchor.node;
			var offset = anchor.offset;
			
			var xmlDoc = this.doc;
			
			if(node.nodeName === "math"){
				this.path.push({nodeName: nodeName, offset: 1});
				this.path.push({nodeName: "mrow", offset: 2});
				this.path.push({nodeName: "mn", offset: 1});
				
				var scriptingData = xmlUtil.createEmptyScripting(xmlDoc, nodeName);
				node.appendChild(scriptingData.rootNode);

				node = scriptingData.focusNode;
				offset = 0;
				return {node: node, offset: offset};
			}
			
			if(offset == 0){
				// layout/token节点前
				var prev = node.previousSibling;
				if(prev){
					var pos = this.path.pop();
					var oldOffset = pos.offset;
					return this._createScriptingAfter(prev,oldOffset-1,nodeName);
				}else{
					// 在节点前插入一个base为空的上标
					var pos = this.path.pop();// node
					var oldOffset = pos.offset;
					this.path.push({nodeName: nodeName, offset: oldOffset});// offset的值不改变
					this.path.push({nodeName: "mrow", offset: 2});
					this.path.push({nodeName: "mn", offset: 1});
					var scriptingData = xmlUtil.createEmptyScripting(xmlDoc, nodeName);
					dripLang.insertNodeBefore(scriptingData.rootNode, node);
					node = scriptingData.focusNode;
					offset = 0;
					return {node: node, offset: offset};
				}
			}else{
				//layout/token节点后
				var pos = this.path.pop();
				var oldOffset = pos.offset;
				return this._createScriptingAfter(node,oldOffset,nodeName);
			}
		},
		
		_createScriptingAfter: function(node, pathOffset, scriptNodeName){
			// summary:
			//		在node节点后输入^,
			//		node: DomNode
			//		pathOffset: 
			//			node在父节点中的位置，从1开始
			//		scriptNodeName:
			// layout/token节点后
			var xmlDoc = this.doc;
			if(node.nodeName === "mo"){
				this.path.push({nodeName: scriptNodeName, offset: pathOffset+1});// 不替换，在后面追加
				this.path.push({nodeName: "mrow", offset: 2});
				this.path.push({nodeName: "mn", offset: 1});
				var scriptingData = xmlUtil.createEmptyScripting(xmlDoc, scriptNodeName);
				dripLang.insertNodeAfter(scriptingData.rootNode, node);
				node = scriptingData.focusNode;
				
			}else{
				this.path.push({nodeName: scriptNodeName, offset: pathOffset});// 用上下标替换原来的节点
				this.path.push({nodeName: "mrow", offset: 2});
				this.path.push({nodeName: "mn", offset: 1});
				
				
				var scriptingData = null;
				if(node.previousSibling){
					var prev = node.previousSibling;
					scriptingData = xmlUtil.createScriptingWithBase(xmlDoc, node, scriptNodeName);
					dripLang.insertNodeAfter(scriptingData.rootNode, prev);
				}else if(node.nextSibling){
					var next = node.nextSibling;
					scriptingData = xmlUtil.createScriptingWithBase(xmlDoc, node, scriptNodeName);
					dripLang.insertNodeBefore(scriptingData.rootNode, next);
				}else{
					var parentNode = node.parentNode;
					scriptingData = xmlUtil.createScriptingWithBase(xmlDoc, node, scriptNodeName);
					parentNode.appendChild(scriptingData.rootNode);
				}
				node = scriptingData.focusNode;
				// 此时node已经移出scriptNode
			}
			return {node: node, offset: 0};
		},
		
		_splitNodeIfNeed: function(nodeName){
			// summary:
			//		如果节点满足被拆分的条件，则将节点拆分为两个。
			//		只能用在放置文本节点的节点中，如text节点和mathml的token节点。
			//		
			//		FIXME:名字还不够具体
			// 注意：这里只是split，anchor的值并不改变。
			
			var offset = this.anchor.offset;
			var node = this.anchor.node;
			
			if(!this._isTokenNode(node.nodeName)){
				return;
			}
			
			// 如果当前的nodeName与传入的值相同，则不拆分。
			if(node.nodeName == nodeName){
				return;
			}
			
			var textContent = dripLang.getText(node);
			var textLength = textContent.length;
			
			if(0 < offset && offset < textLength){
				// 拆分
				var part1 = textContent.substring(0, offset);
				var part2 = textContent.substring(offset);
				
				var node2 = this.doc.createElement(node.nodeName);//因为是拆分
				
				dripLang.setText(node, part1);
				dripLang.setText(node2, part2);
				
				dripLang.insertNodeAfter(node2, node);
			}
		},
		
		/***********以下两个事件什么也不做，View在该方法执行完毕后，执行刷新操作********/
		onChanging: function(modelChangingEvent){
			// summary:
			//		准备好所有信息，可以修改model时，触发的事件。
			
		},
		
		onChanged: function(modelChangedEvent){
			// summary:
			//		model修改完成后触发的事件。
		},
		
		// 如果是中文，则放在text节点中
		// 注意，当调用setData的时候，所有数据都是已经处理好的。
		// 两种判断数据类型的方法：1是系统自动判断；2是人工判断
		// 所以setData应该再加一个参数，表示人工判断的结果，表明数据是什么类型。
		// 如果没有这个参数，则系统自动判断
		// TODO：需要加入位置参数，指明在什么地方插入, FIXME now!!
		// TODO: 该方法需要重构，因为太多的针对不同类型的节点名称进行编程，而不是
		//		 经过抽象后的逻辑。
		// FIXME：拆开两种模式之后，就要准确显示哪些字符可以在哪种模式下输入。
		setData: function(insertInfo){
			// summary:
			//		往model中插入数据。
	    	//		一个约定：在插入数据时，在一个节点前，插入一个新的节点，光标位置依然停留在原来的位置，即节点之前；
	    	//		而在删除数据时，删掉一个节点前的节点，节点依然停留在之前节点的前面。
			//
			//		insertInfo: JSON Object
			//		插入数据的详情。
			//		data: String || Array
			//			要插入的内容	
			// 		nodeName：String
			//			将data作为什么节点插入，这个通常由人工选择，如果没有值，则系统自动判断。
			//		removeCount: Int
			//			默认为0，要移除的字符的数量，在新增data前，从当前聚焦位置往前删除removeCount个字符。
			
			var data = insertInfo.data;
			var nodeName = insertInfo.nodeName;
			var removeCount = insertInfo.removeCount;
			
			if(removeCount && removeCount > 0){
				for(var i = 0; i < removeCount; i++){
					this.removeLeft();
				}
			}

			// TODO:提取一个document作为总的model
			//	然后将mathml和text各自的操作拆分开
			if(this.isTextMode()){
				
				// FIXME: 是不是在要切换模式时，就把节点也切换好呢？
				// 如果节点不在text模式下，则切换到text节点下。
				
				var node = this.anchor.node;
				var offset = this.anchor.offset;
				// 如果已经到了math节点的右边界，则在math后追加一个text节点
				if(node.nodeName === "math"){
					if(offset === 0){
						var prev = node.previousSibling;
						var pos = this.path.pop();
						if(!prev || prev.nodeName != "text"){
							var xmlDoc = this.doc;
							prev = xmlDoc.createElement("text");
							dripLang.insertNodeBefore(prev, node);
						}else{
							pos.offset--;
						}
						pos.nodeName = prev.nodeName;
						this.path.push(pos);
						if(prev.nodeName === "text"){
							this.anchor.node = prev;
							this.anchor.offset = dripLang.getText(prev).length;
						}
					}else if(offset === 1){
						// 先获取下一个text节点，如果没有获取到，则插入一个空白的text节点。
						var next = node.nextSibling;
						if(!next || next.nodeName != "text"){
							var xmlDoc = this.doc;
							next = xmlDoc.createElement("text");
							dripLang.insertNodeAfter(next, node);
						}
						if(next.nodeName === "text"){
							this._movePathToNextSibling(next);
							this.anchor.node = next;
							this.anchor.offset = 0;
						}
					}
				}
				
				this.anchor = this.insertText(this.anchor, data);
				this.onChanged(data);
				return;
			}else if(this.isMathMLMode()){
				if(dripLang.isNewLine(data)){
					return; // 输入回车符号，则什么也不做。
				}
				
				// 做一个转换，用来处理静默映射转换，并不需要弹出提示框,相当于是一个命令
				// 目前有的转换：
				//		^ --> msup  
				//		_ --> msub
				var commandStack = {"^":"msup", "_":"msub"};
				if(commandStack[data]){
					nodeName = commandStack[data];
					data = "";
				}
					
				
				var node = this.anchor.node;
				var isNumericCharacter = false;
				var isTrigonometric = false;
				var isCommandString = insertInfo.isCommandString;
				if(!nodeName){
					if(dripLang.isLetter(data)){
						nodeName = "mi";
					}else if(dripLang.isNumber(data)){
						nodeName = "mn";
					}else if(dripLang.isOperator(data)){
						nodeName = "mo";
					}else if(dripLang.isFenced(data)){
						nodeName = "mfenced";
					}
				}else{
					if(dripLang.isGreekLetter(data)){
						// 传入的nodeName必须是mi
						isNumericCharacter = true;
					}else if(dripLang.isTrigonometric(data)){
						// 传入的nodeName必须是mi
						isTrigonometric = true;
					}
				}
				
				
				if(node.nodeName == "text" || node.nodeName == "line"){
					// 先把nodeName确认下来
					// TODO:在0.0.2版本中，根据输入的字符智能判定进入哪个输入模式。
					this.anchor = this.textToMathMLMode(this.anchor, nodeName);
				}
				
				// 移除占位符
				var node = this.anchor.node;
				var offset = this.anchor.offset;
				if(xmlUtil.isPlaceHolder(node)){
					// TODO:重构，提取方法
					// 移除占位符时，大部分时候，layout节点中为空，接下来就要在layout节点中输入内容，不是在
					// layout节点外的前面，也不是节点外的后面，而是节点内。
					var pos = this.path.pop();
					var pathOffset = pos.offset;
					// 这里约定，占位符是父节点中的唯一节点
					this.anchor.node = node.parentNode;
					this.anchor.offset = layoutOffset.select;
					xmlUtil.removePlaceHolder(node);
				}
				
				var modelChangingEvent = {};
				modelChangingEvent.data = data;
				// 传入event
				// event.data
				// event.canceled
				this.onChanging(modelChangingEvent);
				var newData = modelChangingEvent.newData;
				if(newData && newData.match){// 判断输入的值，与推荐字条是否匹配
//					data = newData.data;// 在onChanging事件中变化输入的值。
//					nodeName = newData.nodeName;
					
				}
//				if(canceled){
//					return;
//				}
				
				// 在这里可以对anchor的值做一次调整

				// 判断新增的节点的父节点是不是msup，如果是则将多余的节点移出msup
				// 如果放在最后的话，node的深度不确定。因此这里在添加新节点前，就先调整好位置
				
				var insertPlaceholder = false;

				if(this._isSupBaseMrow(node.parentNode) || this._isSubBaseMrow(node.parentNode)){
					
					// 在新输入一个节点时，如果输入完成后offset==0，则说明是放在了node的前面。
					// 因为是每新加一个节点都要做调整，所以只需要判断一次。
					if(nodeName === "mn" && node.nodeName === "mn"){
						// 如果两者同为mn时，则不调整位置。
					}else{
						if(offset === 0){
							// 如果输入的节点在base节点前
							this.path.pop();// 当前的node
							this.path.pop();// mrow
							
							this.anchor.node = node.parentNode.parentNode;
							this.anchor.offset = 0;
						}else{
							if(nodeName === "mo"){
								this.anchor.node = node.parentNode;// base mrow
								this.anchor.offset = layoutOffset.select;
								var scriptingNode = node.parentNode.parentNode;
								dripLang.insertNodeBefore(node, scriptingNode);
								var moNode = this.doc.createElement("mo");
								dripLang.setText(moNode, data);
								
								dripLang.insertNodeBefore(moNode,scriptingNode);
								insertPlaceholder = true;
								this.path.pop(); // 当前的base node
								this.path.pop(); //mrow
								var pos = this.path.pop(); //scripting node
								pos.offset+=2;
								this.path.push(pos);
								this.path.push({nodeName:"mrow", offset:1});
							}else{
								// 这里认为已在任何节点的末尾
								// 将原来的base node移到sup前面，将当前焦点放在baseMrow中
								this.anchor.node = node.parentNode;
								this.anchor.offset = layoutOffset.select;
								var scriptingNode = node.parentNode.parentNode;
								dripLang.insertNodeBefore(node, scriptingNode);
								this.path.pop(); // 当前的base node
								this.path.pop(); //mrow
								var pos = this.path.pop(); //scripting node
								pos.offset++;
								this.path.push(pos);
								this.path.push({nodeName:"mrow", offset:1});
							}
						}
					}
				}
				
				// 因为letter只是一个字符，所以不需要循环处理
				if(insertPlaceholder){
					var node = this.anchor.node;
					var base = xmlUtil.getPlaceHolder(this.doc);
					node.appendChild(base);
					this.path.push({nodeName:base.nodeName, offset: 1});
					this.anchor.node = base;
					this.anchor.offset = 0;
				}else if(nodeName === "mi"){
					// 推断周围的字符，如果能够拼够一个三角函数，则插入三角函数
					if(isCommandString){
						// 当是命令字符串时，将由n个字符构成的命令放在一个mi中。
						// FIXME：这个判断还有没有存在的必要呢？
						this.anchor = this.insertMi(this.anchor, data, nodeName);
					}
					else if(isNumericCharacter){
						this.anchor = this.insertMi(this.anchor, data, nodeName);
					}else if(isTrigonometric){
						this.anchor = this.insertTrigonometric(this.anchor, data, nodeName);
					}else{
						// FIXME：将推断逻辑，放在这里是不是不太合适呢？
						// 因为需要将推导的值，与提示的值进行比较。
						var tri = this.findTrigonometric(this.anchor, data, nodeName);
						//this.onChanging(tri); FIXME：如何提示三角函数
						if(tri){
							this.anchor = this.removeExistTrigonometricPart(this.anchor, tri);
							this.anchor = this.insertTrigonometric(this.anchor, tri.functionName, nodeName);
						}else{
							this.anchor = this.insertMi(this.anchor, data, nodeName);
						}
					}
					
				}else if(nodeName === "mn"){
					// 目前只支持输入数字时，剔除占位符。
					this.anchor = this.insertMn(this.anchor, data, nodeName);
				}else if(nodeName === "mo"){
					this.anchor = this.insertMo(this.anchor, data, nodeName);
				}else if(nodeName === "mfenced"){
					this._splitNodeIfNeed(nodeName);
					this.anchor = this.insertFenced(this.anchor, data, nodeName);
				}else if(nodeName === "mfrac"){
					// 有两种输入分数的方式：
					//		1.是用户输入'frac'或'fs',输入一个空的分数
					//		2.是用户输入'/',然后往前找节点，直到遇到操作符号，将这些节点作为分子，光标落在分母上（TODO:0.0.2版本实现）
					
					// 当前版本，两种方式都输入一个空的分数，不做推断。
					this._splitNodeIfNeed(nodeName);
					this.anchor = this.insertMfrac(this.anchor, data, nodeName);
				}else if(nodeName === "msqrt"){
					this._splitNodeIfNeed(nodeName);
					this.anchor = this.insertMsqrt(this.anchor, data, nodeName);
				}else if(nodeName === "mroot"){
					this._splitNodeIfNeed(nodeName);
					this.anchor = this.insertMroot(this.anchor, data, nodeName);
				}else if(nodeName === "msub" || nodeName == "msup"){
					this._splitNodeIfNeed(nodeName);
					this.anchor = this.insertScripting(this.anchor, data, nodeName);
				}
				
				this.onChanged(data);
				return;
			}
		},
		
		_updateAnchor: function(focusNode, offset){
			// FIXME：在0.0.2时删除。
			// 判断focusNode与node是否相等，是不是判断引用呢？
			// 如果是的话，两者相等，就无需重新赋值。
			this.anchor.node = focusNode;
			this.anchor.offset = offset;
		},

		
		_removeEmptyDenominator: function(node/*占位符*/){
			// summary:
			//		删除空的分母
			this.path.pop();// 弹出占位符
			this.path.pop();// 弹出mrow
			var pos = this.path.pop();// 弹出mfrac
			// 获取分子的最后一个节点
			var numeratorMrow = node.parentNode.previousSibling;
			var lastChild = numeratorMrow.lastChild;
			// 如果分子中有mstyle节点，不要删除mstyle节点，因为那是分子的一部分，这里并不修改分子的任何内容。
			if(lastChild.nodeName == "mstyle"){
				// mstyle中有且必须要有一个子节点
				lastChild = lastChild.lastChild;
			}
			pos.nodeName = lastChild.nodeName; // offset保持不变
			this.path.push(pos);
			this.anchor.node = lastChild;
			// FIXME：重构出一个方法叫做计算出offset
			if(this._isTokenNode(lastChild.nodeName)){
				this.anchor.offset = this._getTextLength(lastChild);
			}else{
				this.anchor.offset = 1;
			}
			
			// 进行实际的删除操作
			// 将分子中的内容移到mfrac之前，然后删除mfrac节点
			// 要判断mfrac外有没有mstyle节点，如果有，并且mstyle中就只有一个子节点，则也要删掉mstyle
			
			var mfrac = numeratorMrow.parentNode;
			if(this._isMstyleAndHasOneChild(mfrac.parentNode)){
				mfrac = mfrac.parentNode;// 此时已是mstyle节点
			}
			var len = numeratorMrow.childNodes.length;
			var parentNode = mfrac.parentNode;
			for(var i = 0; i < len; i++){
				parentNode.insertBefore(numeratorMrow.firstChild, mfrac);
			}
			parentNode.removeChild(mfrac);
		},
		
		_removeEmptyNumerator: function(node/*占位符*/){
			this.path.pop();// 弹出占位符
			this.path.pop();// 弹出mrow
			var pos = this.path.pop();// 弹出mfrac
			// 获取分母的第一个节点（暂时决定，将光标放在第一个字母的前面，而不是前一个节点的后面）
			var denominatorMrow = node.parentNode.nextSibling;
			var firstChild = denominatorMrow.firstChild;
			if(firstChild.nodeName == "mstyle"){
				// mstyle中有且必须要有一个子节点
				firstChild = firstChild.firstChild;
			}
			pos.nodeName = firstChild.nodeName; // offset保持不变,与之前mfrac的相同
			this.path.push(pos);
			this.anchor.node = firstChild;
			this.anchor.offset = 0;
			
			// 进行实际的删除操作
			// 将分母中的内容移到mfrac之前，然后删除mfrac节点
			var len = denominatorMrow.childNodes.length;
			var mfrac = denominatorMrow.parentNode;
			if(this._isMstyleAndHasOneChild(mfrac.parentNode)){
				mfrac = mfrac.parentNode;// 此时已是mstyle节点
			}
			
			var parentNode = mfrac.parentNode;
			for(var i = 0; i < len; i++){
				parentNode.insertBefore(denominatorMrow.firstChild, mfrac);
			}
			parentNode.removeChild(mfrac);
		},
		
		_removeEmptyRootBase: function(node /*占位符*/){
			// summary:
			//		删除空的根式中的base
			this.path.pop(); // 弹出占位符
			this.path.pop(); // 弹出mrow
			var pos = this.path.pop();
			// 获取根次的最后一个节点
			var indexMrow = node.parentNode.nextSibling;
			var lastChild = indexMrow.lastChild;
			pos.nodeName = lastChild.nodeName;
			this.path.push(pos);
			this.anchor.node = lastChild;
			if(this._isTokenNode(lastChild.nodeName)){
				this.anchor.offset = this._getTextLength(lastChild);
			}else{
				this.anchor.offset = 1;
			}
			// 进行实际的删除操作
			// 将根次中的内容移到mroot之前，然后删除mroot节点
			var len = indexMrow.childNodes.length;
			var mroot = indexMrow.parentNode;
			var parentNode = mroot.parentNode;
			for(var i = 0; i < len; i++){
				parentNode.insertBefore(indexMrow.firstChild, mroot);
			}
			parentNode.removeChild(mroot);
		},
		
		_removeEmptyRootIndex: function(node /*mn 占位符*/){
			// summary:
			//		删除根式中的空的index节点，同时将根式删除
			this.path.pop();// 弹出占位符
			this.path.pop();// 弹出mrow
			var pos = this.path.pop();
			// 获取根数中的第一个节点
			var baseMrow = node.parentNode.previousSibling;
			var firstChild = baseMrow.firstChild;
			pos.nodeName = firstChild.nodeName;
			this.path.push(pos);
			this.anchor.node = firstChild;
			this.anchor.offset = 0;
			// 进行实际的删除操作
			// 将根数中的内容移到mroot之前，然后删除mroot节点
			var len = baseMrow.childNodes.length;
			var mroot = baseMrow.parentNode;
			var parentNode = mroot.parentNode;
			for(var i = 0; i < len; i++){
				parentNode.insertBefore(baseMrow.firstChild, mroot);
			}
			parentNode.removeChild(mroot);
		},
		
		_removeLeftMathLayoutNode: function(node /*math layout node*/){
			if(this._isMstyleAndHasOneChild(node.parentNode)){
				node = node.parentNode;
			}
			
			// 当父节点中只有一个子节点时
			if(node.parentNode.childNodes.length == 1){
				// 判断parentNode是不是mstyle
				this._moveToTopLeft(node);
				var parentNode = node.parentNode;
				parentNode.removeChild(node);
				if(parentNode.nodeName === "math" && dripLang.getChildLength(parentNode) ===0){
					this.anchor.offset = layoutOffset.select;
				}
			}else if(node.previousSibling){
				var prev = node.previousSibling;
				if(prev.nodeName === "mstyle"){
					prev = prev.lastChild;
				}
				this._moveToPreviousSiblingEnd(prev);
				node.parentNode.removeChild(node);
			}else if(node.nextSibling){
				var next = node.nextSibling;
				if(next.nodeName === "mstyle"){
					// next中必须有子节点，所以不再添加判断
					next = next.firstChild;
				}
				// 注意，因为这里要把后一个节点删除掉，所以偏移量不能+1
				// TODO:重构到一个方法中，暂时还没有想到一个好的方法名
				var pos = this.path.pop();
				pos.nodeName = next.nodeName;
				//pos.offset--;// 获取焦点的节点是next节点
				this.path.push(pos);
				this.anchor.node = next;
				this.anchor.offset = 0;
				node.parentNode.removeChild(node);
			}
		},
		
		_removeRightMathLayoutNode: function(node /*math layout node*/){
			if(this._isMstyleAndHasOneChild(node.parentNode)){
				node = node.parentNode;
			}
			
			// 当父节点中只有一个子节点时
			if(node.parentNode.childNodes.length == 1){
				this._moveToTopLeft(node);
				var parentNode = node.parentNode;
				parentNode.removeChild(node);
				if(parentNode.nodeName === "math" && dripLang.getChildLength(parentNode) ===0){
					this.anchor.offset = layoutOffset.select;
				}
			}else if(node.nextSibling){
				var next = node.nextSibling;
				if(next.nodeName === "mstyle"){
					// next中必须有子节点，所以不再添加判断
					next = next.firstChild;
				}
				// 注意，因为这里要把前一个节点删除掉，所以偏移量不变
				// TODO:重构到一个方法中，暂时还没有想到一个好的方法名
				//  FIXME：重构，下面的实现，与removeLeft中的实现一样
				var pos = this.path.pop();
				pos.nodeName = next.nodeName;
				this.path.push(pos);
				this.anchor.node = next;
				this.anchor.offset = 0;
				node.parentNode.removeChild(node);
			}else if(node.previousSibling){
				// FIXME：重构，与removeLeft中的代码一样
				var prev = node.previousSibling;
				if(prev.nodeName === "mstyle"){
					prev = prev.lastChild;
				}
				this._moveToPreviousSiblingEnd(prev);
				node.parentNode.removeChild(node);
			}
		},
		
		_replaceNodeWithPlaceHolder: function(node){
			var pos = this.path.pop();
			var placeHolder = xmlUtil.getPlaceHolder(this.doc);
			pos.nodeName = placeHolder.nodeName;
			this.path.push(pos);
			this.anchor.node = placeHolder;
			this.anchor.offset = 0;
			
			node.parentNode.insertBefore(placeHolder, node);
			node.parentNode.removeChild(node);
		},
		
		_canRemoveLeftNode: function(node, offset){
			// summary:
			//		满足左删除时，将节点删掉的条件
			var canRemove = false;
			if(this._isTokenNode(node.nodeName)){
				var contentLength = this._getTextLength(node);
				if(contentLength == 1 && offset == 1){
					canRemove = true;
				}
			}else{
				// 布局节点
				if(offset == 1){
					canRemove = true;
				}
			}
			return canRemove;
		},
		
		_canRemoveRightNode: function(node, offset){
			var canRemove = false;
			if(this._isTokenNode(node.nodeName)){
				var contentLength = this._getTextLength(node);
				if(contentLength == 1 && offset == 0){
					canRemove = true;
				}
			}else{
				// 布局节点
				if(offset == 0){
					canRemove = true;
				}
			}
			return canRemove;
		},
		
		_isSoleChildInMrow: function(node){
			// summary:
			//		判断node是mrow节点中的唯一一个子节点
			return node.parentNode.nodeName === "mrow" && dripLang.getChildLength(node.parentNode) === 1;
		},
		
		_isSoleChildInMsqrt: function(node){
			return node.parentNode.nodeName === "msqrt" && dripLang.getChildLength(node.parentNode) === 1;
		},
		
		// TODO：因为在输入根式或分数完成后，会让其中的某个节点获取焦点，这个时候删除的时候，就不能快速
		// 删除整个的分数了，所以要进行判断，如果是个空的分数或根式，则就可以直接删除掉整个分数/根式
		// 不要敲两次键盘才删除一个布局节点，在移到布局节点时，就高亮显示整个节点，然后点击珊瑚时，直接删除即可。

		removeRight: function(){
			// summary:
			//		删除光标右边的字符或节点
			
			var offset = this.anchor.offset;
			var node = this.anchor.node;
			
			var line = this._isLineEnd(this.anchor);
			if(line){
				var next = line.nextSibling;
				if(next){
					if(next.childNodes.length == 0){
						next.parentNode.removeChild(next);
					}else{
						if(line.childNodes.length ==0){
							// 当前行为空行，则删除当前行，让下一行的初始位置获取焦点
							this._moveLineStart(next);
							line.parentNode.removeChild(line);
						}else{
							this._moveLineEnd(line);
							if(line.lastChild.nodeName === "text" && next.firstChild.nodeName === "text"){
								dripLang.appendTextEnd(line.lastChild, dripLang.getText(next.firstChild));
								next.removeChild(next.firstChild);
							}
							var nextChildLength = next.childNodes.length;
							for(var i = 0; i < nextChildLength; i++){
								line.appendChild(next.firstChild);
							}
							next.parentNode.removeChild(next);
						}
					}
				}else{
					this._moveLineEnd(line);
				}
				return;
			}
			
			if(this._isEmptyDenominator(node)){
				this._removeEmptyDenominator(node);
				return;
			}
			
			if(this._isEmptyNumerator(node)){
				this._removeEmptyNumerator(node);
				return;
			}
			
			if(this._isEmptySqrtBase(node)){
				this.path.pop(); // 弹出mn占位符,已经没有mrow节点
				var msqrt = node.parentNode;
				this._removeRightMathLayoutNode(msqrt);
				return;
			}
			
			if(this._isEmptyRootBase(node)){
				this._removeEmptyRootBase(node);
				return;
			}
			
			if(this._isEmptyRootIndex(node)){
				this._removeEmptyRootIndex(node);
				return;
			}
			
			// 将所有需要切换到占位符的逻辑，都放在这里。第一个版本在model中使用显式占位符
			if(this._isSoleChildInMrow(node) || this._isSoleChildInMsqrt(node)/*只有一个子节点*/){
				if(this._canRemoveRightNode(node, offset)){
					this._replaceNodeWithPlaceHolder(node);
					return;
				}
			}
			
			
			if(this._isTokenNode(node.nodeName)){
				var contentLength = this._getTextLength(node);
				if(contentLength == offset){
					if(xmlUtil.isPlaceHolder(node)){
						var parentNode = node.parentNode;
						this.anchor.node = parentNode;
						this.anchor.offset = 0;
						this.path.pop();
						parentNode.removeChild(node);
						
						if(parentNode.nodeName === "math" && dripLang.getChildLength(parentNode) == 0){
							this.anchor.offset = layoutOffset.select;
						}
						return;
					}
					var next = node.nextSibling;
					if(next){
						var nextLength = this._getTextLength(next);
						if(nextLength == 1){
							// path和anchor的值都不变
							// 删除节点
							next.parentNode.removeChild(next);
						}else{
							var oldText = dripLang.getText(next);
							dripLang.setText(next, oldText.substring(1, nextLength));
						}
					}
					
					return;
				}else if(offset == 0){
					if(contentLength == 1){
						// 要删除这个节点
						
						// 先找后一个节点，
						var next = node.nextSibling;
						if(next){
							// offset保持不变
							// nodeName的值改变
							var pos = this.path.pop();
							pos.nodeName = next.nodeName;
							this.path.push(pos);
							this.anchor.node = next;
							this.anchor.offset = 0;
							node.parentNode.removeChild(node);
							return dripLang.getText(node);
						}
						// 找不到后一个节点，则找前一个节点
						var prev = node.previousSibling;
						if(prev){
							this._moveToPreviousSiblingEnd(prev);
							node.parentNode.removeChild(node);
							return;
						}
						
						// 找不到前一个节点，则找父节点
						// FIXME：这里的逻辑还不严谨
						this.path.pop();
						this.anchor.node = node.parentNode;
						
						if(node.parentNode.nodeName === "math" && dripLang.getChildLength(node.parentNode) === 1){
							this.anchor.offset = layoutOffset.select;
						}else{
							this.anchor.offset = 0;//如果是line的话为0
						}
						var removed = null;
						if(this._isTokenNode(node.nodeName)){
							removed = dripLang.getText(node);
						}
						node.parentNode.removeChild(node);
						return removed;
					}else{
						var oldText = dripLang.getText(node);
						var removed = oldText.charAt(offset);
						var newText = dripString.insertAtOffset(oldText, offset+1, "", 1);
						dripLang.setText(node, newText);
						// anchor.node和anchor.offset的值都不变，path的值也都不变。
						return removed;
					}
				}else{
					// 在之间
					var oldText = dripLang.getText(node);
					var removed = oldText.charAt(offset);
					var newText = dripString.insertAtOffset(oldText, offset+1, "", 1);
					dripLang.setText(node, newText);
					// anchor.node和anchor.offset的值都不变，path的值也都不变。
					return removed;
				}
				return;
			}else if(dripLang.isMathLayoutNode(node)){
				// 如果是mathml layout节点
				this._removeRightMathLayoutNode(node);
				return;
			}
		},
		
		removeLeft: function(){
			// summary:
			//		删除光标左边的字符或节点
			//		TODO：实现逻辑可不可以调整为，先调用moveLeft移动光标，然后执行一次删除操作。
			// return:String|node
			//		删除的内容，如果是token节点，则是字符；如果是layout节点，则是节点。
			//		FIXME：如何表示已删除的内容呢？或者什么也不返回。删除一行，则使用换行符标识返回值
			
			var offset = this.anchor.offset;
			var node = this.anchor.node;
			
			var line = this._isLineStart(this.anchor);
			if(line){
				var prev = line.previousSibling;
				if(prev){
					this._movePathToPreviousSibling(prev);
					this._moveLineEnd(prev);
					if(line.childNodes.length > 0){
						// FIXME：解决多个节点都复制的问题
						if(prev.lastChild.nodeName === "text" && line.firstChild.nodeName === "text"){
							dripLang.appendTextEnd(prev.lastChild, dripLang.getText(line.firstChild));
							line.removeChild(line.firstChild);
						}
						var childLength = line.childNodes.length;
						for(var i = 0; i < childLength; i++){
							prev.appendChild(line.firstChild);
						}
					}
					line.parentNode.removeChild(line);
				}else{
					// 如果是第一行，则什么也不做
					this._moveLineStart(line);
				}
				return;
			}
			
			if(this._isEmptyDenominator(node)){
				this._removeEmptyDenominator(node);
				return;
			}
			
			if(this._isEmptyNumerator(node)){
				this._removeEmptyNumerator(node);
				return;
			}
			
			if(this._isEmptySqrtBase(node)){
				this.path.pop(); // 弹出mn占位符，因为没有mrow，所以下面不再弹出
				var msqrt = node.parentNode;
				this._removeLeftMathLayoutNode(msqrt);
				return;
			}
			
			if(this._isEmptyRootBase(node)){
				this._removeEmptyRootBase(node);
				return;
			}
			
			if(this._isEmptyRootIndex(node)){
				this._removeEmptyRootIndex(node);
				return;
			}
			
			// 将所有需要切换到占位符的逻辑，都放在这里。第一个版本在model中使用显式占位符
			// msqrt是个特殊的节点
			if(this._isSoleChildInMrow(node) || this._isSoleChildInMsqrt(node)/*只有一个子节点*/){
				if(this._canRemoveLeftNode(node, offset)){
					this._replaceNodeWithPlaceHolder(node);
					return;
				}
			}
			
			// FIXME：如果要删除的是前一个节点，或前一个节点的内容，则要如何处理？
			if(this._isTokenNode(node.nodeName)){
				var contentLength = this._getTextLength(node);
				if(offset == 0){
					if(xmlUtil.isPlaceHolder(node)){
						this.anchor.node = node.parentNode;
						this.anchor.offset = 0;
						this.path.pop();
						var parentNode = node.parentNode;
						parentNode.removeChild(node);
						if(parentNode.nodeName === "math" && dripLang.getChildLength(parentNode) == 0){
							this.anchor.offset = layoutOffset.select;
						}
						
						return;
					}
					var prev = node.previousSibling;
					if(prev){
						var prevLength = this._getTextLength(prev);
						if(prevLength == 1){
							var pos = this.path.pop();
							pos.offset--;//只修改偏移量
							this.path.push(pos);
							// 删除节点
							prev.parentNode.removeChild(prev);
						}else{
							var oldText = dripLang.getText(prev);
							dripLang.setText(prev, oldText.substring(0, prevLength - 1));
						}
					}
					return;
				}
				
				if(contentLength > 1){
					var oldText = dripLang.getText(node);
					var removed = oldText.charAt(offset - 1);
					newText = dripString.insertAtOffset(oldText, offset, "", 1);
					dripLang.setText(node, newText);
					// path不变，anchor.node不变
					this.anchor.offset--;
					return removed;
				}else if(contentLength == 1){
					// 先找前一个兄弟节点
					var prev = node.previousSibling;
					// 如果prev是layout节点，就要开始往里走
					if(prev){
						if(this._isMstyleAndHasOneChild(prev)){
							prev = prev.firstChild;
						}
						this.anchor.node = prev;
						this._movePathToPreviousSibling(prev);
						if(this._isTokenNode(prev.nodeName)){
							this.anchor.offset = this._getTextLength(prev);
						}else{
							this.anchor.offset = 1;
						}
						node.parentNode.removeChild(node);
						return dripLang.getText(node);
					}
					// 若找不到前一个兄弟节点，则找父节点, FIXME：这里的逻辑还不严谨
					this.path.pop();
					var parentNode = node.parentNode;
					this.anchor.node = parentNode;
					// math和msqrt中包含隐含的mrow，剩下的layout节点中包含mrow，这里通常不用判断mroot等。
					if(parentNode.nodeName === "math" && dripLang.getChildLength(parentNode) === 1){
						this.anchor.offset = layoutOffset.select;
					}else{
						this.anchor.offset = 0;
					}
					parentNode.removeChild(node);
					return dripLang.getText(node);
				}else if(contentLength == 0){
					// 现在只有为占位符的时候，长度才为0
				}
				return;
			}else if(dripLang.isMathLayoutNode(node)){
				// 如果是mathml layout节点
				// TODO：考虑删除前一个节点的情况
				if(offset === layoutOffset.before){
					if(this._isMstyleAndHasOneChild(node.parentNode)){
						node = node.parentNode;
					}
					var prev = node.previousSibling;
					if(prev){
						// TODO:提取出一个删除token节点的方法，参考上面的实现
						// 当prev是token节点时
						if(this._isTokenNode(prev.nodeName)){
							var prevLength = this._getTextLength(prev);
							if(prevLength == 1){
								var pos = this.path.pop();
								pos.offset--;//只修改偏移量
								this.path.push(pos);
								// 删除节点
								prev.parentNode.removeChild(prev);
							}else{
								var oldText = dripLang.getText(prev);
								dripLang.setText(prev, oldText.substring(0, prevLength - 1));
							}
						}
						
						
					}
				}else if(offset === layoutOffset.after){
					this._removeLeftMathLayoutNode(node);
				}
				return;
			}
		},
		
		_isTokenNode: function(nodeName){
			return dripLang.isMathTokenName(nodeName) || nodeName === "text";
		},
		
		_isEmptyDenominator: function(node /*mn 占位符*/){
			// summary:
			//		判断是不是空的分母
			return xmlUtil.isPlaceHolder(node) && this._isDenominatorMrow(node.parentNode);
		},
		
		_isEmptyNumerator: function(node /*mn 占位符*/){
			// summary:
			//		判断是不是空的分子
			return xmlUtil.isPlaceHolder(node) && this._isNumeratorMrow(node.parentNode);
		},
		
		_isEmptySqrtBase: function(node /*mn 占位符*/){
			// summary:
			//		判断平方根中的根数是否没有内容
			return xmlUtil.isPlaceHolder(node) && this._isSqrt(node.parentNode);
		},
		
		_isEmptyRootBase: function(node /*mn 占位符*/){
			// summary:
			//		判断根式中的根数是否没有任何内容，即只有占位符
			return xmlUtil.isPlaceHolder(node) && this._isRootBaseMrow(node.parentNode);
		},
		
		_isEmptyRootIndex: function(node /*mn 占位符*/){
			// summary:
			//		判断根式中的根次中没有任何内容，即只有占位符
			return xmlUtil.isPlaceHolder(node) && this._isRootIndexMrow(node.parentNode);
		},
		
		_isDenominatorMrow: function(node/*mrow*/){
			// summary:
			//		判断当前节点是分母所在的mrow节点
			
			return node && node.nodeName === "mrow" && node.parentNode.nodeName === "mfrac" && node.previousSibling;
		},
		
		_isNumeratorMrow: function(node/*mrow*/){
			// summary:
			//		判断当前节点是分子所在的mrow节点
			
			return node && node.nodeName === "mrow" && node.parentNode.nodeName === "mfrac" && node.nextSibling;
		},
		
		_isSqrt: function(node/*msqrt节点*/){
			// summary:
			//		直接判断是不是msqrt，因为在msqrt不显式包含mrow节点
			
			return node.nodeName === "msqrt";
		},
		
		_isRootIndexMrow: function(rootIndexMrow/*mrow*/){
			// summary:
			//		判断当前节点是不是根式的根次所在的mrow节点
			//		<mroot>base index</mroot>
			
			return rootIndexMrow && 
				rootIndexMrow.nodeName === "mrow" && 
				rootIndexMrow.parentNode.nodeName === "mroot" && 
				rootIndexMrow.previousSibling;
		},
		
		_isRootBaseMrow: function(rootBaseMrow){
			// summary:
			//		判断当前节点是不是根式的根数所在的mrow节点
			//		<mroot>base index</mroot>
			
			return rootBaseMrow && 
				rootBaseMrow.nodeName === "mrow" && 
				rootBaseMrow.parentNode.nodeName === "mroot" && 
				rootBaseMrow.nextSibling;
		},
		
		_isSupSuperscriptMrow: function(node /*mrow*/){
			// summary:
			//		判断当前节点是不是根式的根数所在的mrow节点
			//		<msup>base superscript</msup>
			return node && node.nodeName === "mrow" && node.parentNode.nodeName === "msup" && node.previousSibling;
		},
		
		_isSubSubscriptMrow: function(node /*mrow*/){
			return node && node.nodeName === "mrow" && node.parentNode.nodeName === "msub" && node.previousSibling;
		},
		
		_isSupBaseMrow: function(node /*mrow*/){
			// summary:
			//		判断当前节点是不是上标式子中的base节点
			//		<msup>base superscript</msup>
			return node && node.nodeName === "mrow" && node.parentNode.nodeName === "msup" && node.nextSibling;
		},
		
		_isSubBaseMrow: function(node /*mrow*/){
			// summary:
			//		判断当前节点是不是上标式子中的base节点
			//		<msup>base superscript</msup>
			return node && node.nodeName === "mrow" && node.parentNode.nodeName === "msub" && node.nextSibling;
		},
		
		_isLastFenceChildMrow: function(node /*mrow*/){
			// summary:
			//		判断当前节点是不是括号中的最后一个mrow节点
			return node && node.nodeName === "mrow" && node.parentNode.nodeName === "mfenced" && node.nextSibling==null;
		},
		
		_isFirstChildFenceChildMrow: function(node /*mrow*/){
			// summary:
			//		判断当前节点是不是括号中的第一个mrow节点
			return node && node.nodeName === "mrow" && node.parentNode.nodeName === "mfenced" && node.previousSibling==null;
		},
		
		_getTextLength: function(tokenNode){
			// summary:
			//		获取节点中有效符号的个数，注意这个长度不是字符的长度。
			//		如sin是一个三角函数，它的长度是1，而不是3。
			
			var length = 0;
			if(xmlUtil.isPlaceHolder(tokenNode)){
				// 占位符中内容的长度为0
				return 0;
			}else{
				// 只有token节点，才需要计算
				var nodeName = tokenNode.nodeName;
				if(nodeName === "mn" || nodeName === "text"){
					length = dripLang.getText(tokenNode).length;
				}else if(nodeName === "mo" || nodeName === "mi"){
					// mo和mi的长度永远为1
					length = 1;
				}
			}
			return length;
		},
		
		
		
		_isLineNode: function(node){
			return node.nodeName === "line";
		},
		
		_isLineStart: function(anchor){
			// summary:
			//		处理所有处于行首的判断。
			//		有三种情况：
			//		1. 处于一个空行中
			//		2. 行中第一个节点是text节点，并且offset的值为0
			//		3. 行中第一个节点是math节点，并且offset的值为0
			//
			//		在判断逻辑中调节path。
			// 		如果不是行首，则返回false；如果是行尾则返回当前行。
			//		FIXME:在这个方法中处理了两个逻辑，为的是减少条件判断。寻找更好的重构手段。
			
			var node = anchor.node;
			var offset = anchor.offset;
			
			var nodeName = node.nodeName;
			if(nodeName === "line"){
				return node;
			}else if(nodeName === "text" && offset === 0 && !node.previousSibling){
				this.path.pop();
				return node.parentNode;
			}else if(nodeName === "math" && offset === 0 && !node.previousSibling){
				this.path.pop();
				return node.parentNode;
			}
			return false;
		},
		
		_isLineEnd: function(anchor){
			// summary：
			//		在判断逻辑中调节path。
			// 		如果不是行尾，则返回false；如果是行尾则返回当前行。
			//		FIXME:在这个方法中处理了两个逻辑，为的是减少条件判断。寻找更好的重构手段。
			var node = anchor.node;
			var offset = anchor.offset;
			var nodeName = node.nodeName;
			if(nodeName === "line"){
				return node;
			}else if(nodeName === "text" && offset === dripLang.getText(node).length  && !node.nextSibling){
				this.path.pop();// 从路径中移除text节点
				return node.parentNode;
			}else if(nodeName === "math" && offset === 1 && !node.nextSibling){
				this.path.pop();
				return node.parentNode;
			}
			
			return false;
		},
		
		_isMathMLNodeEnd: function(node, offset){
			return ( dripLang.isMathTokenNode(node) && this._getTextLength(node)===offset) ||
				(dripLang.isMathLayoutNode(node) && offset === layoutOffset.after);
		},
		
		_isMathMLNodeStart: function(node, offset){
			if(offset!=0)return false;
			return dripLang.isMathTokenNode(node) || dripLang.isMathLayoutNode(node);
		},
		
		_movePathToNextSibling: function(nextSibling){
			// summary:
			//		将path的值设为下一个兄弟节点。
			//		注意：在一个token节点中移动光标时，不需要调整path的值。
			
			var pos = this.path.pop();
			pos.offset++;
			pos.nodeName = nextSibling.nodeName;
			this.path.push(pos);
		},
		
		_movePathToPreviousSibling: function(nextSibling){
			// summary:
			//		将path的值设为下一个兄弟节点。
			//		注意：在一个token节点中移动光标时，不需要调整path的值。
			
			var pos = this.path.pop();
			pos.offset--;
			pos.nodeName = nextSibling.nodeName;
			this.path.push(pos);
		},
		
		_moveLineStart: function(line){
			// summary:
			//		移到行首
			var childCount = line.childNodes.length;
			if(childCount === 0){
				this.anchor.node = line;
				this.anchor.offset = 0;
				return;
			}
			var firstChild = line.firstChild;
			var firstChildNodeName = firstChild.nodeName;
			if(firstChildNodeName === "text"){
				this.anchor.node = firstChild;
				this.anchor.offset = 0;
				this.path.push({nodeName: firstChildNodeName, offset: 1});
				return;
			}
			
			if(firstChildNodeName === "math"){
				this.anchor.node = firstChild;
				this.anchor.offset = 0;
				this.path.push({nodeName: firstChildNodeName, offset: 1});
				return;
			}
			
			console.error("没有添加第一个节点是"+firstChildNodeName+"时，进入行首的逻辑");
		},
		
		_moveLineEnd: function(line){
			// summary:
			//		移到行尾，不处理调整行的path
			var childCount = line.childNodes.length;
			if(childCount === 0){
				this.anchor.node = line;
				this.anchor.offset = 0;
				return;
			}
			var lastChild = line.lastChild;
			var lastChildNodeName = lastChild.nodeName;
			if(lastChildNodeName === "text"){
				this.anchor.node = lastChild;
				this.anchor.offset = dripLang.getText(lastChild).length;
				this.path.push({nodeName: lastChildNodeName, offset: childCount});
				return;
			}
			
			if(lastChildNodeName === "math"){
				this.anchor.node = lastChild;
				this.anchor.offset = 1;
				this.path.push({nodeName: lastChildNodeName, offset: childCount});
				return;
			}
			
			console.error("没有添加最后一个节点是"+lastChildNodeName+"时，进入行尾的逻辑");
		},
		
		_moveToTopRight: function(node/*mrow*/){
			// summary:
			//		往右上外层移动
			this.path.pop();
			this.anchor.node = node.parentNode;
			this.anchor.offset = 1; // 往上移动时，节点为layout节点。
		},
		
		// moveOutTopLeft
		_moveToTopLeft: function(node){
			// summary:
			//		往左上内层移动
			this.path.pop();
			var parentNode = node.parentNode;
			this.anchor.node = node.parentNode;
			this.anchor.offset = 0; // 往上移动时，节点为layout节点。
		},
		
		_moveInNodeStart: function(node/*layout node*/){
			// summary:
			//		移到node内的第一个节点前
			var firstChild = node.firstChild;
			if(firstChild.nodeName === "mstyle"){
				firstChild = firstChild.firstChild;
			}
			this.path.push({nodeName:firstChild.nodeName, offset:1});
			this.anchor.node = firstChild;
			this.anchor.offset = 0;
		},
		
		_moveInNodeEnd: function(node/*layout node*/){
			// summary:
			//		移到node内最后一个节点后
			var lastChild = node.lastChild;
			if(lastChild.nodeName === "mstyle"){
				lastChild = lastChild.lastChild;
			}
			this.path.push({nodeName: lastChild.nodeName, offset: node.childNodes.length});
			this.anchor.node = lastChild;
			if(this._isTokenNode(lastChild.nodeName)){
				// 往里层走，所以path是追加 moveIn
				this.anchor.offset = this._getTextLength(lastChild);
			}else{
				// 不是token节点，就是layout节点，获取是msytle等节点
				// 注意，如果是layout节点，往左边移动时，offset会一直保持为1
				this.anchor.offset = 1;
			}
		},
		
		_moveToPreviousSiblingEnd: function(prev){
			// summary:
			//		将光标移到前一个节点的后面， 这个方法目前只在math节点中测试过。
			
			this._movePathToPreviousSibling(prev);
			this.anchor.node = prev;
			if(this._isTokenNode(prev.nodeName)){
				this.anchor.offset = this._getTextLength(prev);
			}else{
				this.anchor.offset = 1;
			}
		},
		
		_moveToNextSiblingStart: function(next){
			// summary:
			//		将光标移到后一个节点的前面， 这个方法目前只在math节点中测试过。
			
			this._movePathToNextSibling(next);
			this.anchor.node = next;
			this.anchor.offset = 0;
		},
		
		_moveLeftToDenominatorEnd: function(node/*mfrac节点*/){
			// summary:
			//		左移，移到分母的结束位置
			
			var denominatorMrow = node.lastChild; // mrow
			this.path.push({nodeName: denominatorMrow.nodeName, offset: 2/*分母是第二个子节点*/});
			var lastChild = denominatorMrow.lastChild;
			var offset = 1;
			if(this._isTokenNode(lastChild.nodeName)){
				offset = this._getTextLength(lastChild);
			}else{
				if(lastChild.nodeName === "mstyle"){
					lastChild = lastChild.lastChild;
				}
			}
			this.path.push({nodeName: lastChild.nodeName, offset:dripLang.getChildLength(denominatorMrow)});
			this.anchor.node = lastChild;
			this.anchor.offset = offset;
		},
		
		_moveLeftDenominatorToNumerator: function(denominatorMrow/*分母*/){
			// summary
			//		左移，从分母最前面，移动到分子最后面

			// 移到分子中
			// 如果遇到mrow，则停止往左外层走，开始找分子节点
			var numeratorMrow = denominatorMrow.previousSibling;
			this._movePathToPreviousSibling(numeratorMrow);
			var lastChild = numeratorMrow.lastChild;
			// TODO:将这个方法提取出来
			if(this._isTokenNode(lastChild.nodeName)){
				this.path.push({nodeName: lastChild.nodeName, offset:numeratorMrow.childNodes.length});
				this.anchor.node = lastChild;
				this.anchor.offset = this._getTextLength(lastChild);
			}else{
				if(lastChild.nodeName === "mstyle"){
					lastChild = lastChild.lastChild;
				}
				this.path.push({nodeName: lastChild.nodeName, offset:lastChild.parentNode.childNodes.length});
				this.anchor.node = lastChild;
				this.anchor.offset = 1;
			}
		},
		
		_moveRightToNumeratorStart: function(node/*mfrac节点*/){
			// summary:
			//		右移，移到分子的起始位置
			
			var numeratorMrow = node.firstChild; // mrow
			this.path.push({nodeName: numeratorMrow.nodeName, offset: 1/*分子是第一个子节点*/});
			var firstChild = numeratorMrow.firstChild;
			if(this._isTokenNode(firstChild.nodeName)){
				
			}else{
				if(firstChild.nodeName === "mstyle"){
					firstChild = firstChild.firstChild;
				}
			}
			this.path.push({nodeName: firstChild.nodeName, offset:1});
			this.anchor.node = firstChild;
			this.anchor.offset = 0;
		},
		
		_moveRightNumeratorToDenominator: function(numeratorMrow/*分子*/){
			// summary
			//		右移，从分子最后面，移动到分母最前面
			
			var denominatorMrow = numeratorMrow.nextSibling;
			this._movePathToNextSibling(denominatorMrow);
			var firstChild = denominatorMrow.firstChild;
			if(this._isTokenNode(firstChild.nodeName)){
				
			}else{
				if(firstChild.nodeName === "mstyle"){
					firstChild = firstChild.firstChild;
				}
			}
			this.path.push({nodeName: firstChild.nodeName, offset: 1});
			this.anchor.node = firstChild;
			this.anchor.offset = 0;
		},
				
		_moveRightMrootIndexToBase: function(rootIndexMrow/*mroot index mrow*/){
			var rootBaseMrow = rootIndexMrow.previousSibling;
			this._movePathToPreviousSibling(rootBaseMrow);
			var firstChild = rootBaseMrow.firstChild;
			this.path.push({nodeName: firstChild.nodeName, offset: 1});
			this.anchor.node = firstChild;
			this.anchor.offset = 0;
		},

		_moveLeftMrootBaseToIndex: function(rootBaseMrow){
			var rootIndexMrow = rootBaseMrow.nextSibling;
			this._movePathToNextSibling(rootBaseMrow);
			var lastChild = rootIndexMrow.lastChild;
			this.path.push({nodeName: lastChild.nodeName, offset: rootIndexMrow.childNodes.length});
			this.anchor.node = lastChild;
			if(this._isTokenNode(lastChild.nodeName)){
				this.anchor.offset = this._getTextLength(lastChild);
			}else{
				this.anchor.offset = 1;
			}
		},
		
		_moveLeftMsupSuperscriptToBase: function(superscriptMrow){
			var msupBaseMrow = superscriptMrow.previousSibling;
			this._movePathToPreviousSibling(msupBaseMrow);
			var lastChild = msupBaseMrow.lastChild;
			this.path.push({nodeName: lastChild.nodeName, offset: msupBaseMrow.childNodes.length});
			this.anchor.node = lastChild;
			if(this._isTokenNode(lastChild.nodeName)){
				this.anchor.offset = this._getTextLength(lastChild);
			}else{
				this.anchor.offset = 1;
			}
		},
		
		_moveLeftMsubSubscriptToBase: function(subscriptMrow){
			this._moveLeftMsupSuperscriptToBase(subscriptMrow)
		},
		
		_moveRightMsupBaseToSuperscript: function(baseMrow){
			var superscriptMrow = baseMrow.nextSibling;
			this._movePathToNextSibling(superscriptMrow);
			var firstChild = superscriptMrow.firstChild;
			this.path.push({nodeName: firstChild.nodeName, offset: 1});
			this.anchor.node = firstChild;
			this.anchor.offset = 0;
		},
		
		_moveRightMsubBaseToSubscript: function(baseMrow){
			this._moveRightMsupBaseToSuperscript(baseMrow);
		},
				
		_canMoveRightWithInToken: function(anchor){
			var node = anchor.node;
			if(xmlUtil.isPlaceHolder(node))return false;
			var offset = anchor.offset;
			
			if(this._isTokenNode(node.nodeName) && 0 <= offset && offset < dripLang.getText(node).length){
				return true;
			}
			
			return false;
		},
		
		_canMoveLeftWithInToken: function(anchor){
			var node = anchor.node;
			if(xmlUtil.isPlaceHolder(node))return false;
			var offset = anchor.offset;
			
			if(this._isTokenNode(node.nodeName) && 0 < offset && offset <= dripLang.getText(node).length){
				return true;
			}
			
			return false;
		},
		
		_moveRightToMsqrtBaseStart: function(node/*msqrt节点*/){
			// summary:
			//		右移，往根式里层走，走到根数最前面。msqrt中不会显式包含mrow
			var firstChild = node.firstChild;
			this.path.push({nodeName: firstChild.nodeName, offset: 1});
			this.anchor.node = firstChild;
			this.anchor.offset = 0; // 如果前一个节点是token节点时，需要显式赋值。
		},
		
		_moveLeftToMsqrtBaseEnd: function(node/*msqrt节点*/){
			// summary:
			//		左移，往根式里走，走到根数的最后面。msqrt中不会显式包含mrow
			var lastChild = node.lastChild;
			this.path.push({nodeName: lastChild.nodeName, offset: lastChild.childNodes.length});
			this.anchor.node = lastChild;
			if(this._isTokenNode(lastChild.nodeName)){
				this.anchor.offset = this._getTextLength(lastChild);
			}else{
				this.anchor.offset = 1;
			}
		},
		
		_moveLeftToMrootBaseEnd: function(node/*mroot节点*/){
			// summary:
			//		左移，往根式里走，走到根数的最后面。mroot中有mrow节点
			var baseMrow = node.firstChild; //mrow，只有调用firstChild才能保证永远正确
			this.path.push({nodeName: baseMrow.nodeName, offset: 1/*base是第一个节点*/});
			var lastChild = baseMrow.lastChild;
			this.path.push({nodeName: lastChild.nodeName, offset: dripLang.getChildLength(baseMrow)});
			this.anchor.node = lastChild;
			if(this._isTokenNode(lastChild.nodeName)){
				this.anchor.offset = this._getTextLength(lastChild);
			}else{
				this.anchor.offset = 1;
			}
		},
		
		_moveRightToMrootIndexStart: function(node/*mroot节点*/){
			// summary:
			//		右移，往根式里层走，走到根次最前面。约定：mroot中有且只有两个mrow节点，第一个为base节点，第二个为index节点
			
			var indexMrow = node.lastChild; // mrow
			this.path.push({nodeName: indexMrow.nodeName, offset: 2/*因为index mrow是mroot中的第二个节点*/});
			var firstChild = indexMrow.firstChild;
			this.path.push({nodeName: firstChild.nodeName, offset:1});
			this.anchor.node = firstChild;
			this.anchor.offset = 0;
		},
		
		_moveLeftToMsupSuperscriptEnd: function(node/*msup节点*/){
			// summary:
			//		左移，移动到上标的最后面。约定：msup中有且只有两个mrow节点
			var superscriptMrow = node.lastChild;
			this.path.push({nodeName: superscriptMrow.nodeName, offset: 2/*因为superscript mrow是msup中的第二个节点*/});
			var lastChild = superscriptMrow.lastChild;
			this.path.push({nodeName: lastChild.nodeName, offset: superscriptMrow.childNodes.length});
			this.anchor.node = lastChild;
			if(this._isTokenNode(lastChild.nodeName)){
				this.anchor.offset = this._getTextLength(lastChild);
			}else{
				this.anchor.offset = 1;
			}
		},
		_moveLeftToMsubSuperscriptEnd: function(node/*msup节点*/){
			// summary:
			//		左移，移动到上标的最后面。约定：msup中有且只有两个mrow节点
			this._moveLeftToMsupSuperscriptEnd(node);
		},
		
		_moveRightToMsupBaseStart: function(node /*msup*/){
			// summary:
			//		右移，移到sup的base最前面。约定：msup中有且只有两个mrow节点
			var baseMrow = node.firstChild;
			this.path.push({nodeName: baseMrow.nodeName, offset: 1});
			var firstChild = baseMrow.firstChild;
			this.path.push({nodeName: firstChild.nodeName, offset: 1});
			this.anchor.node = firstChild;
			this.anchor.offset = 0;
		},
		
		_moveRightToMfencedInnerStart: function(node /*mfence*/){
			// summary:
			//		右移，移到fence里面的起始处。
			var mrow = node.firstChild;
			this.path.push({nodeName: mrow.nodeName, offset: 1});
			var firstChild = mrow.firstChild;
			this.path.push({nodeName: firstChild.nodeName, offset: 1})
			this.anchor.node = firstChild;
			this.anchor.offset = 0;
		},
		
		_moveLeftToMfencedInnerEnd: function(node /*mfence*/){
			// summary:
			//		左移，移到fence里面的结尾处。
			var mrow = node.lastChild;
			this.path.push({nodeName: mrow.nodeName, offset: 1});
			var lastChild = mrow.lastChild;
			this.path.push({nodeName: lastChild.nodeName, offset: mrow.childNodes.length})
			this.anchor.node = lastChild;
			if(this._isTokenNode(lastChild.nodeName)){
				this.anchor.offset = this._getTextLength(lastChild);
			}else{
				this.anchor.offset = 1;
			}
		},
		
		
		// TODO:重命名，因为左移，有左移一个字母和左移一个单词之分，所以需要命名的更具体。
		// 只有英文才有这种情况。
		moveLeft: function(){
			console.log("左移前", this.anchor);
			var node = this.anchor.node;
			var offset = this.anchor.offset;
			
			var line = this._isLineStart(this.anchor);
			if(line){
				var prev = line.previousSibling;
				if(prev){
					this._movePathToPreviousSibling(prev);
					// 因为只支持排版方向为从左到右的情况，所以是移到上一行的最后位置。
					this._moveLineEnd(prev);
				}else{
					// 因为在_isLineStart中删除了之前的节点，
					// 但是我们需要焦点停留在原来的位置，因此重新加上。
					// FIXME：暂时重新加上，要是能不做这一步操作，也能完成同样的功能，最好。
					this._moveLineStart(line);
				}
				return;
			}
			// 在token之内移动
			if(this._canMoveLeftWithInToken(this.anchor)){
				this.anchor.offset--;
				return;
			}
			
			// TODO：从math往里层走。
			// 先分两种情况考虑，一个是token节点，一个是lyaout节点
			// 都是在节点之间移动。
			// 先单个情况具体处理，然后找出共性再提取。
			var nodeName = node.nodeName;
			if(nodeName === "math"){
				if(offset === layoutOffset.after){
					if(node.lastChild){
						// 往里层移动
						this._moveInNodeEnd(node)
					}else{
						this.anchor.offset = layoutOffset.select;
					}
					this.mode = "mathml";
				}else if(offset === layoutOffset.select){
					this.anchor.offset = layoutOffset.before;
					this.mode = "text";
				}else if(offset === layoutOffset.before){
					var prev = node.previousSibling;
					if(prev  && prev.nodeName === "text"){
						// math到text
						this._movePathToPreviousSibling(prev);
						this.anchor.node = prev;
						this.anchor.offset = dripLang.getText(prev).length - 1;
						this.mode = "text";
					}
				}
				return;
			}
			
			// 以下是节点之间的移动，现在约定math节点和text节点必须是交替出现的，不会同时出现两个math或两个text
			// text到math
			var prev = node.previousSibling;
			if(prev && node.nodeName === "text" && prev.nodeName === "math"){
				this._movePathToPreviousSibling(prev);
				if(dripLang.getChildLength(prev) > 0){
					this._moveInNodeEnd(prev);
				}else{
					this.anchor.node = prev;
					this.anchor.offset = layoutOffset.select;// 因为肯定是layout节点，所以不做token判断。
				}
				this.mode = "mathml";
				return;
			}
			
			

			if(nodeName === "mfrac" && offset ===1){
				// 往里层走
				var lastChild = node.lastChild;
				if(lastChild.nodeName === "mrow"){
					this.path.push({nodeName: lastChild.nodeName, offset: node.childNodes.length});
					// mfrac中的mrow要放在path中
					lastChild = lastChild.lastChild;
					if(lastChild.nodeName === "mstyle"){
						// 分数中嵌套分数的情况
						lastChild = lastChild.lastChild;
					}
					this.path.push({nodeName: lastChild.nodeName, offset: lastChild.parentNode.childNodes.length});
				}
				
				this.anchor.node = lastChild;
				if(this._isTokenNode(lastChild.nodeName)){
					// 往里层走，所以path是追加 moveIn
					this.anchor.offset = this._getTextLength(lastChild);
				}else{
					// 不是token节点，就是layout节点，获取是msytle等节点
					// 注意，如果是layout节点，往左边移动时，offset会一直保持为1
					// this.anchor.offset = 1;
					
				}
				return;
			}
			
			if(nodeName === "msqrt" && offset === 1){				
				this._moveLeftToMsqrtBaseEnd(node);
				return;
			}
			if(nodeName === "mroot" && offset === 1){
				this._moveLeftToMrootBaseEnd(node);
				return;
			}
			if(nodeName === "msup" && offset === 1){
				this._moveLeftToMsupSuperscriptEnd(node);
				return;
			}
			if(nodeName === "msub" && offset === 1){
				this._moveLeftToMsubSuperscriptEnd(node);
				return;
			}
			if(nodeName === "mfenced" && offset === 1){
				this._moveLeftToMfencedInnerEnd(node);
				return;
			}
			
			// TODO:需不需要将token与layout的代码合并起来
			if(this._isTokenNode(nodeName) && offset === 0){
				// 先找前一个兄弟节点
				var prev = node.previousSibling;
				if(prev){
					if(prev.nodeName === "mstyle"){
						prev = prev.lastChild;
					}
					this._movePathToPreviousSibling(prev);
					// 如果上一个节点是msqrt节点
					if(prev.nodeName === "msqrt"){
						this._moveLeftToMsqrtBaseEnd(prev);
						return;
					}
					if(prev.nodeName === "mroot"){
						this._moveLeftToMrootBaseEnd(prev);
						return;
					}
					if(prev.nodeName === "msup"){
						this._moveLeftToMsupSuperscriptEnd(prev);
						return;
					}
					if(prev.nodeName === "msub"){
						this._moveLeftToMsubSuperscriptEnd(prev);
						return;
					}
					if(prev.nodeName === "mfenced"){
						this._moveLeftToMfencedInnerEnd(prev);
						return;
					}
					if(prev.nodeName === "mfrac"){
						this._moveLeftToDenominatorEnd(prev);
						return;
					}
					
					
					// 下面是处理token节点的逻辑
					this.anchor.node = prev;
					var len = this._getTextLength(prev);
					if(len > 0){
						this.anchor.offset = len - 1;
					}else{
						 this.anchor.offset = 0;
					}
					return;
				}
				
				// 如果没有前一个兄弟节点，则往上寻找。
				// 往外层移动
				// 从path中移出token
				this.path.pop();
				
				var parentNode = node.parentNode;// 找token的父节点，则一定是layout节点，无需做判断
				if(parentNode && parentNode.nodeName === "mstyle"){
					parentNode = parentNode.parentNode;
				}
				if(this._isDenominatorMrow(parentNode)){
					this._moveLeftDenominatorToNumerator(parentNode);
					return;
				}
				
				if(this._isNumeratorMrow(parentNode)){
					// 往左上移
					this.path.pop();
					this.anchor.node = parentNode.parentNode;
					// this.anchor.offset = 0;
					return;
				}
				if(this._isSqrt(parentNode)){
					// 往左外层移动
					this.anchor.node = parentNode;//是msqrt
					this.anchor.offset = 0; // 往上移动时，节点为layout节点。
					return;
				}
				if(this._isRootBaseMrow(parentNode)){
					this._moveLeftMrootBaseToIndex(parentNode);
					return;
				}
				if(this._isRootIndexMrow(parentNode)){
					this._moveToTopLeft(parentNode);
					return;
				}
				if(this._isSupSuperscriptMrow(parentNode)){
					this._moveLeftMsupSuperscriptToBase(parentNode);
					return;
				}
				if(this._isSubSubscriptMrow(parentNode)){
					this._moveLeftMsubSubscriptToBase(parentNode);
					return;
				}
				if(this._isSupBaseMrow(parentNode) || this._isSubBaseMrow(parentNode)){
					this._moveToTopLeft(parentNode);
					return;
				}
				if(this._isFirstChildFenceChildMrow(parentNode)){
					this._moveToTopLeft(parentNode);
					return;
				}
				
				
				if(parentNode){
					this.anchor.node = parentNode;
					// this.anchor.offset = 0;
					if(parentNode.nodeName === "math"){
						this.mode = "text";
					}
				}
				return;
			}
			
			// TODO：尝试是否可将mfrac改为所有的layout节点名称
			if((nodeName === "mfrac" || 
					nodeName === "msqrt" || 
					nodeName === "mroot" || 
					nodeName === "msup" ||
					nodeName === "msub" ||
					nodeName === "mfenced") && offset === 0){
				
				
				if(node.parentNode.nodeName === "mstyle"){
					node = node.parentNode;
				}
				
				var prev = node.previousSibling;
				if(prev){
					if(prev.nodeName === "mstyle"){
						prev = prev.lastChild;
					}
					this._movePathToPreviousSibling(prev);
					// 如果下一个节点是msqrt节点
					if(prev.nodeName === "msqrt"){
						this._moveLeftToMsqrtBaseEnd(prev);
						return;
					}
					if(prev.nodeName === "mroot"){
						this._moveLeftToMrootBaseEnd(prev);
						return;
					}
					if(prev.nodeName === "msup"){
						this._moveLeftToMsupSuperscriptEnd(prev);
						return;
					}
					if(prev.nodeName === "msub"){
						this._moveLeftToMsubSuperscriptEnd(prev);
						return;
					}
					if(prev.nodeName === "mfenced"){
						this._moveLeftToMfencedInnerEnd(prev);
						return;
					}
					if(prev.nodeName === "mfrac"){
						this._moveLeftToDenominatorEnd(prev);
						return;
					}
					
					// 下面是处理token节点的逻辑
					this.anchor.node = prev;
					var len = this._getTextLength(prev);
					if(len > 0){
						this.anchor.offset = len - 1;
					}else{
						 this.anchor.offset = 0;
					}
					return;
					
				}
				
				// 往外层移动
				this.path.pop();
				
				var parentNode = node.parentNode;// 找token的父节点，则一定是layout节点，无需做判断
				if(parentNode.nodeName === "mstyle"){
					parentNode = parentNode.parentNode;
				}
				
				if(this._isDenominatorMrow(parentNode)){
					this._moveLeftDenominatorToNumerator(parentNode);
					return;
				}
				
				if(this._isNumeratorMrow(parentNode)){
					// 往左上移
					this.path.pop();
					this.anchor.node = parentNode.parentNode;
					// this.anchor.offset = 0;
					return;
				}
				if(this._isSqrt(parentNode)){
					// 往左外层移动
					this.anchor.node = parentNode;//是msqrt
					this.anchor.offset = 0; // 往上移动时，节点为layout节点。
					return;
				}
				if(this._isRootBaseMrow(parentNode)){
					this._moveLeftMrootBaseToIndex(parentNode);
					return;
				}
				if(this._isRootIndexMrow(parentNode)){
					this._moveToTopLeft(parentNode);
					return;
				}
				if(this._isSupSuperscriptMrow(parentNode)){
					this._moveLeftMsupSuperscriptToBase(parentNode);
					return;
				}
				if(this._isSubSubscriptMrow(parentNode)){
					this._moveLeftMsubSubscriptToBase(parentNode);
					return;
				}
				if(this._isSupBaseMrow(parentNode) || this._isSubBaseMrow(parentNode)){
					this._moveToTopLeft(parentNode);
					return;
				}
				if(this._isFirstChildFenceChildMrow(parentNode)){
					this._moveToTopLeft(parentNode);
					return;
				}
				
				if(parentNode){
					
					this.anchor.node = parentNode;
					// this.anchor.offset = 0;
					
					// 如果parentNode是math节点，表示右移出math
					if(parentNode.nodeName === "math"){
						this.mode = "text";
					}
				}
				return;
			}
			
		},
		
		moveRight: function(){
			// summary:
			//		右移时，有的情况是要往外层走；有的时候是要往内层走。
			//		左移也是。
			//	在其中做三件事情：
			//	1. 找到下一个节点
			//	2. 设置当前节点和偏移量
			//	3. 存储当前节点的路径信息
			//
			//	移动路径分析：
			//	1. 由一个token节点移到另一个token节点
			//	2. 由一个token节点移到一个layout节点
			//	3. 由一个layout节点移到token节点
			//	4. 由token节点移到line节点
			//	5. 由layout节点移到line节点
			//	6. 由line节点移到line节点
			//	7. 由line节点移到layout节点
			//	8. 由line节点移到token节点
			//
			//	也谈重构：
			//		不要指望一下子就能发现事物的本质，做事情的第一步就是从现象的累计开始，从琐碎的细节开始，
			//		随着工作的进行，轮廓逐渐的清晰，这个时候本质的真容跃然纸上，这个时候可以重构了。
			//		即使没有重构，至少我们把握住了一些现象，系统依然是可以运行的。
			//		所以说初级系统是首先运行于各种现象的累积之上的；也可进一步优化和重构，让其运行在事务的本质之上。
			//		要抓本质，首先抓事物之间的关系，不要限于同一事物的琐碎中去。
			//
			//	目前支持的有效节点有：
			//	line,text, mathml token, mathml layout(frac)
			//	把移动的特殊情况都罗列出来，然后逐个实现（这就是编辑器的需求）
			//	1. mathml token内部移动：只需调整偏移量 +1
			//	2. text节点内部移动：只需调整偏移量 +1
			//	3. 空行之间移动：node为下一行；偏移量为0；path移到一行
			//	4. text节点移到math节点：移到math上，整个math用另一个背景色显示，或用边框扩住（获取焦点）。
			//	5. math节点移到text节点：math不再获取焦点，移到text的最前面。
			//	6. mathml token节点之间移动：下一个节点获取焦点，偏移量为1；path也移到下一个节点。
			//	7. 从math节点进入其中的第一个有效节点（往内层走）：
			//		找到第一个有效节点：token节点、分数、根号、上下标、括号等。（TODO：补充）
			//	8. 分数
			//		移动到分数前
			//		从分数前移动到分子前
			//		从分子后移动到分母前
			//		从分母后移动到分数后
			//		离开分数后(面)
			//	9. 根号
			//		移到根号前
			//		从根号前移动到根次前
			//		从根次后移动到根式前
			//		从根式后移动到根号后
			//		离开根号后
			//	10. 上下坐标
			//		移到上下坐标前
			//		从上下坐标前直接移到base中（注意差别是直接进入内容）
			//		从base后移到sup/sub前
			//		由sup/sub后移到上下坐标后
			//	11. 括号
			//		移到括号前
			//		从括号前移到括号里的第一个节点前（有效节点）
			//		从最后一个节点后移到括号后
			//		离开括号后
			//	12. ……
			
			// 当需要换行时。
			console.log("右移前", this.anchor);
			
			var line = this._isLineEnd(this.anchor);
			if(line){
				var next = line.nextSibling;
				if(next){
					this._movePathToNextSibling(next);
					// 因为只支持排版方向为从左到右的情况，所以是移到上一行的最后位置。
					this._moveLineStart(next);
				}else{
					// 因为在_isLineEnd中删除了之前的节点，
					// 但是我们需要焦点停留在原来的位置，因此重新加上。
					// FIXME：暂时重新加上，要是能不做这一步操作，也能完成同样的功能，最好。
					this._moveLineEnd(line);
				}
				return;
			}
			// 如果在token节点之内
			if(this._canMoveRightWithInToken(this.anchor)){
				this.anchor.offset++;
				return;
			}
			
			var node = this.anchor.node;
			var offset = this.anchor.offset;
			
			var nodeName = node.nodeName;
			if(nodeName === "math"){
				if(offset == layoutOffset.before){
					if(node.firstChild){
						this._moveInNodeStart(node);
					}else{
						// anchor.node依然是math
						// path保持不变
						this.anchor.offset = layoutOffset.select;
					}
					this.mode = "mathml";
				}else if(offset == layoutOffset.select){
					this.anchor.offset = layoutOffset.after;
					this.mode = "text";
				}else if(offset == layoutOffset.after){
					// math到text
					// math获取焦点，添加边框样式的时机是根据mode的值决定的。
					var next = node.nextSibling;
					if(next && next.nodeName === "text"){
						this._movePathToNextSibling(next);
						this.anchor.node = next;
						//math后，移动一位，移到offset=1
						this.anchor.offset = 1;
						this.mode = "text";
						return;
					}
				}
				
				return;
			}
			// 以下是节点之间的移动，现在约定math节点和text节点必须是交替出现的，不会同时出现两个math或两个text
			// text到math
			// TODO:这段代码放在这里不够严谨
			var next = node.nextSibling;
			if(next && node.nodeName === "text" && next.nodeName === "math"){
				this._movePathToNextSibling(next);
				if(dripLang.getChildLength(next) > 0){
					// 光标放在math中的第一个节点前面
					this._moveInNodeStart(next);
				}else{
					this.anchor.node = next;
					this.anchor.offset = layoutOffset.select;// 因为肯定是layout节点，所以不做token判断。
				}
				this.mode = "mathml";
				return;
			}
			
			// 移进mfrac
			if(nodeName === "mfrac" && offset ===0){
				// 往里层走 FIXME：重构方法
				var firstChild = node.firstChild;
				if(firstChild.nodeName === "mrow"){
					this.path.push({nodeName: firstChild.nodeName, offset: 1});
					// mfrac中的mrow要放在path中
					firstChild = firstChild.firstChild;
					if(firstChild.nodeName === "mstyle"){
						// 分数中嵌套分数的情况
						firstChild = firstChild.firstChild;
					}
					this.path.push({nodeName: firstChild.nodeName, offset: 1});
				}
				
				this.anchor.node = firstChild;
				//this.anchor.offset = 0;
				return;
			}
			if(nodeName === "msqrt" && offset ===0){
				this._moveRightToMsqrtBaseStart(node);
				return;
			}
			if(nodeName === "mroot" && offset === 0){
				this._moveRightToMrootIndexStart(node);
				return;
			}
			if(nodeName === "msup" && offset === 0){
				this._moveRightToMsupBaseStart(node);
				return;
			}
			if(nodeName === "mfenced" && offset === 0){
				this._moveRightToMfencedInnerStart(node);
				return;
			}
			
			// TODO:需不需要将token与layout的代码合并起来
			// FIXME:需要统一layout部件的处理逻辑。
			// 这里需要切换到下一个节点，下一个节点是什么类型的节点，需要再做判断。
			if((nodeName === "msqrt" || 
					nodeName === "mfrac" || 
					nodeName === "mroot" || 
					nodeName === "msup" ||
					nodeName === "mfenced") && offset === 1){
				// 先找下一个节点
				// 在找以前，看一下父节点是不是mstyle节点，这里一个约定，就是一个mstyle中只有一个非mrow节点
				if(node.parentNode.nodeName === "mstyle"){
					// 往外走
					node = node.parentNode;
				}
				
				var next = node.nextSibling;
				if(next){
					if(next.nodeName === "mstyle"){
						// 往里走
						next = next.firstChild;
					}
					
					this._movePathToNextSibling(next);
					// 如果下一个节点是msqrt节点
					if(next.nodeName === "msqrt"){
						this._moveRightToMsqrtBaseStart(next);
						return;
					}
					if(next.nodeName === "mroot"){
						this._moveRightToMrootIndexStart(next);
						return;
					}
					if(next.nodeName === "msup"){
						this._moveRightToMsupBaseStart(next);
						return;
					}
					if(next.nodeName === "mfenced"){
						this._moveRightToMfencedInnerStart(next);
						return;
					}
					if(next.nodeName === "mfrac"){
						this._moveRightToNumeratorStart(next);
						return;
					}
					
					// 以下是token节点的逻辑
					this.anchor.node = next;
					var len = this._getTextLength(next);
					if(len > 0){
						this.anchor.offset = 1;
					}else{
						 this.anchor.offset = 0;
					}
					return;
				}
				
				// 往外层移动
				this.path.pop();
				var parentNode = node.parentNode;// 找token的父节点，则一定是layout节点，无需做判断
				if(parentNode.nodeName === "mstyle"){
					parentNode = parentNode.parentNode;
				}
				if(this._isNumeratorMrow(parentNode)){
					this._moveRightNumeratorToDenominator(parentNode);
					return;
				}
				if(this._isDenominatorMrow(parentNode)){
					this._moveToTopRight(parentNode);
					return;
				}
				if(this._isSqrt(parentNode)){
					// 往外层移动，此时parentNode已经是msqrt，不需要弹出mrow，因为没有mrow
					this.anchor.node = parentNode;
					this.anchor.offset = 1;
					return;
				}
				if(this._isRootIndexMrow(parentNode)){
					this._moveRightMrootIndexToBase(parentNode);
					return;
				}
				if(this._isRootBaseMrow(parentNode)){
					this._moveToTopRight(parentNode);
					return;
				}
				if(this._isSupBaseMrow(parentNode)){
					this._moveRightMsupBaseToSuperscript(parentNode);
					return;
				}
				if(this._isSubBaseMrow(parentNode)){
					this._moveRightMsubBaseToSubscript(parentNode);
					return;
				}
				if(this._isSupSuperscriptMrow(parentNode)){
					this._moveToTopRight(parentNode);
					return;
				}
				if(this._isSubSubscriptMrow(parentNode)){
					this._moveToTopRight(parentNode);
					return;
				}
				
				if(this._isLastFenceChildMrow(parentNode)){
					this._moveToTopRight(parentNode);
					return;
				}
				
				if(parentNode){
					this.anchor.node = parentNode;
					// this.anchor.offset = 1;
					
					// 如果parentNode是math节点，表示右移出math
					if(parentNode.nodeName === "math"){
						this.mode = "text";
					}
				}
				return;
			}
			
			
			if(this._isTokenNode(nodeName) && offset === this._getTextLength(node)){
				// 往外层移动
				// 从path中移出token,先寻找有没有下一个节点，如果没有下一个节点，则移到父节点
				var next = node.nextSibling;
				
				if(next){
					if(next.nodeName === "mstyle"){
						next = next.firstChild;
					}
					
					this._movePathToNextSibling(next);
					// 如果下一个节点是msqrt节点
					if(next.nodeName === "msqrt"){
						this._moveRightToMsqrtBaseStart(next);
						return;
					}
					if(next.nodeName === "mroot"){
						this._moveRightToMrootIndexStart(next);
						return;
					}
					if(next.nodeName === "msup"){
						this._moveRightToMsupBaseStart(next);
						return;
					}
					if(next.nodeName === "mfenced"){
						this._moveRightToMfencedInnerStart(next);
						return;
					}
					if(next.nodeName === "mfrac"){
						this._moveRightToNumeratorStart(next);
						return;
					}
					
					// 下面是处理token节点的逻辑
					this.anchor.node = next;
					this.anchor.offset = 1;
					return;
				}
				
				// 没有找到下一个节点，开始往上需找父节点，以下的逻辑都是处理父节点的逻辑
				this.path.pop();
				
				var parentNode = node.parentNode;// 找token的父节点，则一定是layout节点，无需做判断
				if(parentNode && parentNode.nodeName === "mstyle"){
					parentNode = parentNode.parentNode;
				}
				if(this._isNumeratorMrow(parentNode)){
					this._moveRightNumeratorToDenominator(parentNode);
					return;
				}
				if(this._isDenominatorMrow(parentNode)){
					this._moveToTopRight(parentNode);
					return;
				}
				if(this._isSqrt(parentNode)){
					// 往外层移动，此时parentNode已经是msqrt，不需要弹出mrow，因为没有mrow
					this.anchor.node = parentNode;
					this.anchor.offset = 1;
					return;
				}
				if(this._isRootIndexMrow(parentNode)){
					this._moveRightMrootIndexToBase(parentNode);
					return;
				}
				if(this._isRootBaseMrow(parentNode)){
					this._moveToTopRight(parentNode);
					return;
				}
				if(this._isSupBaseMrow(parentNode)){
					this._moveRightMsupBaseToSuperscript(parentNode);
					return;
				}
				if(this._isSubBaseMrow(parentNode)){
					this._moveRightMsubBaseToSubscript(parentNode);
					return;
				}
				if(this._isSupSuperscriptMrow(parentNode)){
					this._moveToTopRight(parentNode);
					return;
				}
				if(this._isSubSubscriptMrow(parentNode)){
					this._moveToTopRight(parentNode);
					return;
				}
				if(this._isLastFenceChildMrow(parentNode)){
					this._moveToTopRight(parentNode);
					return;
				}
				
				
				if(parentNode){
					this.anchor.node = parentNode;
					this.anchor.offset = 1;
					if(parentNode.nodeName === "math"){
						this.mode = "text";
					}
				}
				return;
			}
			
		},
		
		moveUp: function(){
			
		},
		
		moveDown: function(){
			
		},
		
		_getFocusLine: function(){
			// summary:
			//		当前节点往上追溯，获取nodeName为line的行
			
			var focusNode = this.getFocusNode();
			var lineNode = focusNode;
			while(lineNode && lineNode.nodeName != "line"){
				lineNode = lineNode.parentNode;
			}
			
			return lineNode;
		}, 
		
		_isNotSameNode: function(newNodeName, node){
			var nodeName = node.nodeName;
			return newNodeName == nodeName;
		},
		
		_isLineNode: function(node){
			return node.nodeName == "line";
		},
		
		// TODO：起更好的名字，因为textNode容易与document中定义的Text类型的Node混淆
		_isTextNode: function(node){
			return node.nodeName == "text";
		},
		
		_insertChar: function(charData){
			// summary:
			//		在聚焦的节点中，当前光标新的字符，并移动当前光标的位置。
			// FIXME：这个函数做了两件事情
			var focusNode = this.anchor.node;
			var offset = this.anchor.offset;
			
			var oldText = dripLang.getText(focusNode);
			var newText = dripString.insertAtOffset(oldText, offset, charData);
			dripLang.setText(focusNode, newText);
			// 注意，这里输入的char，不管几个字符都当作一个长度处理，如&123;也当作一个字符处理。
			offset += 1;
			
			this._updateAnchor(focusNode, offset);
		},
		
		// 获取xml文件的字符串值。没有没有输入任何内容则返回空字符串。
		getXML: function(){
			var doc = this.doc;
			if(doc.firstChild.firstChild.childNodes.length == 0){
				return "";
			}
			
			return xmlParser.innerXML(this.doc);
		},
		
		isEmpty: function(){
			// summary:
			//		判断model中是否有内容，如果没有值则返回true，否则返回false。
			
			return this.getXML() == "";
		},
		
		// summary:
		//		获取当前获取焦点的节点相对于根节点的path值.
		//		注意，获取的值与xpath并不一致，这里只是将nodeName和offset用字符串形式表示出来。
		getPath: function(){
			var xpath = "";
			array.forEach(this.path, function(path, index){
				xpath += "/";
				xpath += path.nodeName;
				
				if(path.offset){
					xpath += "[" + path.offset + "]";
				}
			});
			return xpath;
		},
		
		getFocusNode: function(){
			return this.anchor.node;
		},
		
		getOffset: function(){
			return this.anchor.offset;
		},
		
		getLines: function(){
			return this.doc.documentElement.childNodes;
		},
		
		getLineAt: function(lineIndex){
			// summary: 
			//		获取行节点。
			// lineIndex: Number
			//		行节点的索引，从0开始
			
			return this.getLines()[lineIndex];
		},
		
		getLineCount: function(){
			return this.getLines().length;
		},
		
		// 习题 line 获取html格式的数据
		//		展示页面时使用
		// FIXME:是不是应该移到view中呢？
		getHTML: function(){
			return dataUtil.xmlDocToHtml(this.doc);
		}
	
	});
	
});