define([ "dojo/_base/array" ], function(array) {

	// 显示对应的快捷键,快捷键就是input中的值
	
	return {
		keywords : [ {
			input: "/", // 用户输入的值
			map: "&#xF7;",  // 在编辑器中实际输入的值
			nodeName: "mo", // 使用那个标签封装
			freq: 0, // 用户选择的频率
			label: "除号", // 在提示菜单中显示的值
			iconClass: "drip_equation_icon drip_division" // 在提示菜单中显示的图标
		},{
			input: "/",
			map: "/",
			nodeName: "text",
			freq: 0,
			label: "/",
			iconClass: ""
		},{
			// <mfrac> numerator(分子) denominator(分母) </mfrac>
			// 当是分数，需要推断出分子时，如果可能有多种情况，则给出一个列表，让用户去选择。
			input: "/",
			map: "",
			nodeName: "mfrac",
			freq: 0,
			label: "分数",
			iconClass: "drip_equation_icon drip_frac"
		},{
			input: "*",
			map: "&#xD7;",
			nodeName: "mo",
			freq: 0,
			label: "乘号",
			iconClass: "drip_equation_icon drip_multiplication"
		},{
			input: "*",
			map: "*",
			nodeName: "text",
			freq: 0,
			label: "*",
			iconClass: ""
		},{
			// 支持输入平方立方，或直接输入数字
			input: "^",
			map: "^",
			nodeName: "text",
			freq: 0,
			label: "^",
			iconClass: ""
		},{
			// 支持输入平方立方，或直接输入数字
			input: "^",
			map: "",
			nodeName: "msup",
			freq: 0,
			label: "上标",
			iconClass: "drip_equation_icon drip_sup"
		},{
			input: "_",
			map: "_",
			nodeName: "text",
			freq: 0,
			label: "_",
			iconClass: ""
		},{
			// 支持输入平方立方，或直接输入数字
			input: "_",
			map: "",
			nodeName: "msub",
			freq: 0,
			label: "下标",
			iconClass: "drip_equation_icon drip_sub"
		},{
			// 支持输入平方根
			input: "sqrt",
			map: "",
			nodeName: "msqrt",
			freq: 0,
			label: "平方根",
			iconClass: "drip_equation_icon drip_sqrt"
		},{
			// 支持输入根数为任意数的根号
			input: "sqrt",
			map: "",
			nodeName: "mroot",
			freq: 0,
			label: "开根号",
			iconClass: "drip_equation_icon drip_root"
		},{
			input: "sin",
			map: "sin",
			nodeName: "mi",
			freq: 0,
			label: "sin",
			iconClass: ""
		},{
			input: "cos",
			map: "cos",
			nodeName: "mi",
			freq: 0,
			label: "cos",
			iconClass: ""
		},{
			input: "tan",
			map: "tan",
			nodeName: "mi",
			freq: 0,
			label: "tan",
			iconClass: ""
		},{
			input: "cot",
			map: "cot",
			nodeName: "mi",
			freq: 0,
			label: "cot",
			iconClass: ""
		} ],

		getProposals : function(prefix) {
			// summary:
			//		根据前缀获取推荐值列表，推荐值按照推荐度倒序排列。
			//		“推荐度”，是整数，值越大推荐度越高。
			
			return array.filter(this.keywords, function(data, index, array) {
				return data.input.indexOf(prefix) == 0;
			});
		}
	};
	
});
