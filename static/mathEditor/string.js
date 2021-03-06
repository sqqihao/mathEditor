define([],function(){
	var string = {};
	
	// 1.以&开始，以;结束
	// 2.操作符 ==
	// 3.操作符 !=
	var operators = ["==","!="];
	
	function matchOperator(data, index){
		// summary:
		//		从operators中匹配操作符。
		//		解析出普通字符组成的操作符(支持长度>=2的操作符)
		// data: String
		//		需要拆分的字符
		// index: Integer
		//		当前查询的字符所在的索引
		// returns:
		//		返回匹配到的字符，如果没有匹配到，则返回null

		var c = data.charAt(index);
		for(var i = 0; i < operators.length; i++){
			var op = operators[i];
			var opLen = op.length;
			if(opLen == 2){
				var firstChar = op.charAt(0);
				var secondChar = op.charAt(1);
				if(c == firstChar && secondChar == data.charAt(index+1)){
					return op;
				}
			}else{
				throw "没有为长度为"+op+"的操作符定义处理逻辑";
			}
		}
		return null;
	}
	
	function matchUnicode(data, index){
		// TODO:重构split中的获取unicode码的方法
	}
	
	string.splitData = function(data){
		// summary:
		//		将传入的数据拆分为最小单元的html符号。
		//		dataArray的每个元素都只能看作一个字符。
		
		var len = data.length;
		var result = [];
		var index = 0;
		var append = false;
		var cache = "";
		var span = 0; //&和;之间字符的个数
		for(var i = 0; i < len; i++){
			
			var matched = matchOperator(data, i);
			if(matched){
				result[index] = matched;
				index++;
				i += matched.length;
				continue;
			}
			
			var c = data.charAt(i);
			// 解析出unicode码
			if(c == "&"){
				span = 0;
				append = true;
				cache = c;
			}else if(append && c == ";"){
				if(span == 0){
					result[index] = cache;
					index++;
					result[index] = c;
					index++;
				}else{
					cache += c;
					result[index] = cache;
					index++;
				}
				append = false;
				cache = "";
			}else{
				if(append){
					cache += c;
					span++;
				}else{
					result[index] = data.charAt(i);
					index++;
				}
			}
		}
		return result;
	},
	
	string.insertAtOffset = function(target, offset, source, removeCount){
		// summary:
		//		在给定字符串的指定偏移量处插入字符串。注意：在文本中直接使用\t表示一个制表符。
		// target: String
		//		目标字符串，会修改该字符串。
		// offset:
		//		偏移量，从0开始
		// source:
		//		需要插入到指定位置的字符串
		// removeCount:
		//		在offset指定的位置往前删除的字符个数
		// returns: String
		//		返回新的字符串
		
		var removeCount = removeCount || 0;
		
		var len = target.length;
		if(offset < 0 || len < offset) return target;
		var part1 = target.substring(0,offset-removeCount);
		var part2 = target.substring(offset)
		return part1 + source + part2;
	}
	
	return string;
});
