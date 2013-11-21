define([ "mathEditor/tests/layer/Cursor", // 未迁移 
         "mathEditor/tests/dataUtil",
         
         "mathEditor/tests/model/loadData",
         "mathEditor/tests/model/switchMode",
         
         "mathEditor/tests/model/setData",
         "mathEditor/tests/model/setData/emptyModel",
         "mathEditor/tests/model/setData/text",
         "mathEditor/tests/model/setData/CJK",
         "mathEditor/tests/model/setData/line",
         "mathEditor/tests/model/setData/tab",
         "mathEditor/tests/model/setData/math",
         "mathEditor/tests/model/setData/mn",
         "mathEditor/tests/model/setData/mi",
         "mathEditor/tests/model/setData/mo",
         "mathEditor/tests/model/setData/trigonometricFunction",
         "mathEditor/tests/model/setData/greekLetter",
         //"mathEditor/tests/model/setData/inferredFrac",// 未迁移
         "mathEditor/tests/model/setData/frac",
         "mathEditor/tests/model/setData/sqrt",
         "mathEditor/tests/model/setData/root",
         "mathEditor/tests/model/setData/sub",
         "mathEditor/tests/model/setData/sup",
         "mathEditor/tests/model/setData/fence",
         // TODO:迁移到这里
         "mathEditor/tests/model/moveLeft/frac",
         "mathEditor/tests/model/moveLeft/line",
         "mathEditor/tests/model/moveLeft/text",
         "mathEditor/tests/model/moveLeft/math",
         "mathEditor/tests/model/moveLeft/mn",
         "mathEditor/tests/model/moveLeft/mi",
         "mathEditor/tests/model/moveLeft/mo",
         "mathEditor/tests/model/moveLeft/sqrt",
         "mathEditor/tests/model/moveLeft/root",
         "mathEditor/tests/model/moveLeft/token",
         "mathEditor/tests/model/moveLeft/sub",
         "mathEditor/tests/model/moveLeft/sup",
         "mathEditor/tests/model/moveLeft/fence",
         
         "mathEditor/tests/model/moveRight/frac",
         "mathEditor/tests/model/moveRight/line",
         "mathEditor/tests/model/moveRight/text",
         "mathEditor/tests/model/moveRight/math",
         "mathEditor/tests/model/moveRight/mi",
         "mathEditor/tests/model/moveRight/mn",
         "mathEditor/tests/model/moveRight/root",
         "mathEditor/tests/model/moveRight/sqrt",
         "mathEditor/tests/model/moveRight/token",
         "mathEditor/tests/model/moveRight/sub",
         "mathEditor/tests/model/moveRight/sup",
         "mathEditor/tests/model/moveRight/fence",
         
         "mathEditor/tests/model/moveLeft",
         
         "mathEditor/tests/model/removeLeft/math",
         "mathEditor/tests/model/removeLeft/mn",
         "mathEditor/tests/model/removeLeft/text",
         "mathEditor/tests/model/removeLeft/line",
         "mathEditor/tests/model/removeLeft/frac",
         "mathEditor/tests/model/removeLeft/sqrt",
         "mathEditor/tests/model/removeLeft/root",
         
         "mathEditor/tests/model/removeLeft",
         
         "mathEditor/tests/model/removeRight/math",
         "mathEditor/tests/model/removeRight/mn",
         "mathEditor/tests/model/removeRight/text",
         "mathEditor/tests/model/removeRight/line",
         "mathEditor/tests/model/removeRight/frac",
         "mathEditor/tests/model/removeRight/sqrt",
         "mathEditor/tests/model/removeRight/root",
         
         "mathEditor/tests/lang",
         "mathEditor/tests/string",
         "mathEditor/tests/MathJaxView",
         "mathEditor/tests/Editor",
         "mathEditor/tests/ContentAssist",
         "mathEditor/tests/mathContentAssist"], 1);