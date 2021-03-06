/**
 * 光标
 */
define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-geometry"],function(
        		declare,
        		lang,
        		domConstruct,
        		domClass,
        		domStyle,
        		domGeom){
	
	return declare("mathEditor.layer.Cursor",null,{
		
		// parentEl: domNode
		//		放置光标的容器节点
		parentEl: null,
		
		caret: null,
		
		isVisible: false,
		
		cursorConfig: {top:0, left:0},
		
		constructor: function(kwArgs){
			lang.mixin(this, kwArgs);
			var caret = this.caret = domConstruct.create("div",{"class":"drip_cursor"},this.parentEl);
			caret.style.visibility = "hidden";
			
			this.defaultHeight = caret.clientHeight;
			this.cursorConfig.height = this.defaultHeight;
		},
		
		show: function(){
			// summary:
			//		显示光标
			
			this.isVisible = true;
			this.caret.style.visibility = "";
			
			this._restartTimer();
		},
		
		move: function(cursorConfig){
			this.cursorConfig = cursorConfig;
			var top = cursorConfig.top;
			var left = cursorConfig.left;
			var height = cursorConfig.height;
			var style = this.caret.style;
			style.top = top+"px";
			style.left = left+"px";
			if(height && height > 0){
				style.height = height+"px";
			}
			if(this.isVisible == false)return;
			
			this.caret.style.visibility = "";
			this._restartTimer();
		},
		
		getCursorConfig: function(){
			return this.cursorConfig;
		},
		
		hide: function(){
			// summary:
			//		隐藏光标
			
			this.caret.style.visibility = "hidden";
			this.isVisible = false;
			clearInterval(this.intervalId);
			this.intervalId = null;
			
			// 当失去光标的时候，确保不要随机的显示出光标，因为关闭了interval,
			// 但是timeout方法还会再执行一次，所以需要显式关闭。
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		},
		
		_restartTimer: function(){
			if(this.intervalId != null){
				clearInterval(this.intervalId);
				this.intervalId = null;
			}
			
			var caret = this.caret;
			var self = this;
			this.intervalId = setInterval(function(){
				caret.style.visibility = "hidden";
	            self.timeoutId = setTimeout(function() {
	            	caret.style.visibility = "";
	            }, 400);
			},1000);
		},
		
		destroy: function(){
			if(this.intervalId != null){
				clearInterval(this.intervalId);
			}
			// 删除光标
			domConstruct.destroy(this.caret);
		}
	
	});
});