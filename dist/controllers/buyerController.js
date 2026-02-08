"use strict";var _excluded=["total_debt"];function _typeof(a){"@babel/helpers - typeof";return _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a},_typeof(a)}function _objectWithoutProperties(a,b){if(null==a)return{};var c,d,e=_objectWithoutPropertiesLoose(a,b);if(Object.getOwnPropertySymbols){var f=Object.getOwnPropertySymbols(a);for(d=0;d<f.length;d++)c=f[d],-1===b.indexOf(c)&&{}.propertyIsEnumerable.call(a,c)&&(e[c]=a[c])}return e}function _objectWithoutPropertiesLoose(a,b){if(null==a)return{};var c={};for(var d in a)if({}.hasOwnProperty.call(a,d)){if(-1!==b.indexOf(d))continue;c[d]=a[d]}return c}function _defineProperty(a,b,c){return(b=_toPropertyKey(b))in a?Object.defineProperty(a,b,{value:c,enumerable:!0,configurable:!0,writable:!0}):a[b]=c,a}function _toPropertyKey(a){var b=_toPrimitive(a,"string");return"symbol"==_typeof(b)?b:b+""}function _toPrimitive(a,b){if("object"!=_typeof(a)||!a)return a;var c=a[Symbol.toPrimitive];if(void 0!==c){var d=c.call(a,b||"default");if("object"!=_typeof(d))return d;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===b?String:Number)(a)}function _regenerator(){function b(a,b,f,g){var h=b&&b.prototype instanceof d?b:d,c=Object.create(h.prototype);return _regeneratorDefine2(c,"_invoke",function(a,b,g){function h(a,b){for(q=a,s=b,e=0;!w&&t&&!c&&e<v.length;e++){var c,f=v[e],g=p.p,h=f[2];3<a?(c=h===b)&&(s=f[(q=f[4])?5:(q=3,3)],f[4]=f[5]=j):f[0]<=g&&((c=2>a&&g<f[1])?(q=0,p.v=b,p.n=f[1]):g<h&&(c=3>a||f[0]>b||b>h)&&(f[4]=a,f[5]=b,p.n=h,q=0))}if(c||1<a)return m;throw w=!0,b}var k,q,s,t=0,v=g||[],w=!1,p={p:0,n:0,v:j,a:h,f:h.bind(j,4),d:function c(a,b){return k=a,q=0,s=j,p.n=b,m}};return function(c,d,f){if(1<t)throw TypeError("Generator is already running");for(w&&1===d&&h(d,f),q=d,s=f;(e=2>q?j:s)||!w;){k||(q?3>q?(1<q&&(p.n=-1),h(q,s)):p.n=s:p.v=s);try{if(t=2,k){if(q||(c="next"),e=k[c]){if(!(e=e.call(k,s)))throw TypeError("iterator result is not an object");if(!e.done)return e;s=e.value,2>q&&(q=0)}else 1===q&&(e=k["return"])&&e.call(k),2>q&&(s=TypeError("The iterator does not provide a '"+c+"' method"),q=1);k=j}else if((e=(w=0>p.n)?s:a.call(b,p))!==m)break}catch(a){k=j,q=1,s=a}finally{t=1}}return{value:e,done:w}}}(a,f,g),!0),c}function d(){}function g(){}function h(){}function i(a){return Object.setPrototypeOf?Object.setPrototypeOf(a,h):(a.__proto__=h,_regeneratorDefine2(a,l,"GeneratorFunction")),a.prototype=Object.create(c),a}/*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var j,e,f="function"==typeof Symbol?Symbol:{},k=f.iterator||"@@iterator",l=f.toStringTag||"@@toStringTag",m={};e=Object.getPrototypeOf;var a=[][k]?e(e([][k]())):(_regeneratorDefine2(e={},k,function(){return this}),e),c=h.prototype=d.prototype=Object.create(a);return g.prototype=h,_regeneratorDefine2(c,"constructor",h),_regeneratorDefine2(h,"constructor",g),g.displayName="GeneratorFunction",_regeneratorDefine2(h,l,"GeneratorFunction"),_regeneratorDefine2(c),_regeneratorDefine2(c,l,"Generator"),_regeneratorDefine2(c,k,function(){return this}),_regeneratorDefine2(c,"toString",function(){return"[object Generator]"}),(_regenerator=function a(){return{w:b,m:i}})()}function _regeneratorDefine2(a,b,c,d){var f=Object.defineProperty;try{f({},"",{})}catch(a){f=0}_regeneratorDefine2=function e(a,b,c,d){function g(b,c){_regeneratorDefine2(a,b,function(a){return this._invoke(b,c,a)})}b?f?f(a,b,{value:c,enumerable:!d,configurable:!d,writable:!d}):a[b]=c:(g("next",0),g("throw",1),g("return",2))},_regeneratorDefine2(a,b,c,d)}function asyncGeneratorStep(b,d,f,e,g,h,a){try{var c=b[h](a),i=c.value}catch(a){return void f(a)}c.done?d(i):Promise.resolve(i).then(e,g)}function _asyncToGenerator(b){return function(){var c=this,d=arguments;return new Promise(function(e,f){function g(a){asyncGeneratorStep(i,e,f,g,h,"next",a)}function h(a){asyncGeneratorStep(i,e,f,g,h,"throw",a)}var i=b.apply(c,d);g(void 0)})}}// src/controllers/buyerController.js
var _require=require("../models"),Buyer=_require.Buyer,SaleTransaction=_require.SaleTransaction,BuyerDebtPayment=_require.BuyerDebtPayment,DailyOperation=_require.DailyOperation,_require2=require("../config/database"),sequelize=_require2.sequelize,_require3=require("./../utils/format12Hour"),format12Hour=_require3.format12Hour,_require4=require("sequelize"),Op=_require4.Op,AppError=require("../utils/app-error.utility");// exports.getBuyerDebtHistory = async (req, res) => {
//   try {
//     const buyer = await Buyer.findByPk(req.params.id);
//     if (!buyer) {
//       return res.status(404).json({
//         success: false,
//         message: 'Buyer not found'
//       });
//     }
//     // Get all sales transactions
//     const transactions = await SaleTransaction.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,as:"operation",
//           attributes: ['id', 'operation_date']
//         }
//       ],
//       order: [['transaction_time', 'DESC']]
//     });
//     // Get all debt payments
//     const payments = await BuyerDebtPayment.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,as:"operation",
//           attributes: ['id', 'operation_date'],
//           required: false
//         }
//       ],
//       order: [['payment_date', 'DESC']]
//     });
//     res.json({
//       success: true,
//       data: {
//         buyer,
//         current_debt: buyer.total_debt,
//         transactions,
//         payments,
//         summary: {
//           total_sales: transactions.length,
//           total_payments: payments.length,
//           total_amount_sold: transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0),
//           total_amount_paid: transactions.reduce((sum, t) => sum + parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid), 0)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching buyer debt history:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching debt history',
//       error: error.message
//     });
//   }
// };
// Record a standalone debt payment (not part of a sale)
// exports.getBuyerDebtHistory = async (req, res) => {
//   try {
//     const buyer = await Buyer.findByPk(req.params.id);
//     if (!buyer) {
//       return res.status(404).json({
//         success: false,
//         message: 'Buyer not found'
//       });
//     }
//     // Get all sales transactions
//     const transactions = await SaleTransaction.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,
//           as: "operation",
//           attributes: ['id', 'operation_date']
//         }
//       ],
//       order: [['transaction_time', 'ASC']] // ASC for chronological calculation
//     });
//     // Get all debt payments
//     const payments = await BuyerDebtPayment.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,
//           as: "operation",
//           attributes: ['id', 'operation_date'],
//           required: false
//         }
//       ],
//       order: [['payment_date', 'ASC']] // ASC for chronological calculation
//     });
//     // Merge and sort all events chronologically
//     const events = [];
//     // Add transactions
//     transactions.forEach(t => {
//       events.push({
//         date: t.transaction_time,
//         type: 'transaction',
//         transaction_id: t.id,
//         total_amount: parseFloat(t.total_amount),
//         paid_amount: parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid || 0),
//         old_debt_paid: parseFloat(t.old_debt_paid || 0),
//         remaining_amount: parseFloat(t.remaining_amount),
//         raw_data: t
//       });
//     });
//     // Add payments
//     payments.forEach(p => {
//       events.push({
//         date: p.payment_date,
//         type: 'payment',
//         payment_id: p.id,
//         amount: parseFloat(p.amount),
//         raw_data: p
//       });
//     });
//     // Sort by date ascending
//     events.sort((a, b) => new Date(a.date) - new Date(b.date));
//     // Calculate cumulative debt
//     let cumulativeDebt = 0;
//     const history = [];
//     events.forEach(event => {
//       if (event.type === 'transaction') {
//         // For transaction: debt increases by remaining_amount
//         const debtIncrease = event.remaining_amount;
//         cumulativeDebt += debtIncrease;
//         history.push({
//           date: event.date,
//           type: 'transaction',
//           transaction_id: event.transaction_id,
//           total_amount: event.total_amount,
//           paid_amount: event.paid_amount,
//           old_debt_paid: event.old_debt_paid,
//           remaining_amount: event.remaining_amount,
//           debt_before: cumulativeDebt - debtIncrease,
//           debt_change: debtIncrease,
//           debt_after: cumulativeDebt,
//           raw_data: event.raw_data
//         });
//       } else if (event.type === 'payment') {
//         // For payment: debt decreases by payment amount
//         const debtDecrease = event.amount;
//         cumulativeDebt -= debtDecrease;
//         history.push({
//           date: event.date,
//           type: 'payment',
//           payment_id: event.payment_id,
//           amount: event.amount,
//           debt_before: cumulativeDebt + debtDecrease,
//           debt_change: -debtDecrease,
//           debt_after: cumulativeDebt,
//           raw_data: event.raw_data
//         });
//       }
//     });
//     // Reverse for display (most recent first)
//     // history.reverse();
//  // Sort by date descending (الأحدث أولاً)
// events.sort((a, b) => new Date(b.date) - new Date(a.date));
//     res.json({
//       success: true,
//       data: {
//         buyer,
//         current_debt: parseFloat(buyer.total_debt),
//         calculated_debt: cumulativeDebt, // Should match current_debt
//         history,
//         summary: {
//           total_sales: transactions.length,
//           total_payments: payments.length,
//           total_amount_sold: transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0),
//           total_amount_paid: transactions.reduce((sum, t) => sum + parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid || 0), 0) + payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching buyer debt history:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching debt history',
//       error: error.message
//     });
//   }
// };
// exports.getBuyerDebtHistory = async (req, res,next) => {
//   try {
//     const buyer = await Buyer.findByPk(req.params.id);
//     if (!buyer) {
//     next(new AppError( 'لم يتم العثور على المشتري',404));
//     }
//     // Get all sales transactions
//     const transactions = await SaleTransaction.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,
//           as: "operation",
//           attributes: ['id', 'operation_date']
//         }
//       ],
//       order: [['transaction_time', 'ASC']]
//     });
//     // Get all debt payments
//     const payments = await BuyerDebtPayment.findAll({
//       where: { buyer_id: req.params.id },
//       include: [
//         {
//           model: DailyOperation,
//           as: "operation",
//           attributes: ['id', 'operation_date'],
//           required: false
//         }
//       ],
//       order: [['payment_date', 'ASC']]
//     });
//     // Create a Set of transaction timestamps for quick lookup
//     const transactionTimestamps = new Set(
//       transactions.map(t => new Date(t.transaction_time).getTime())
//     );
//     // Filter out payments that haven't the exact same timestamp as any transaction
//     const filteredPayments = payments.filter(p => {
//       const paymentTimestamp = new Date(p.payment_date).getTime();
//       return transactionTimestamps.has(paymentTimestamp);
//     });
//   console.log("\n\nfilteredPayments",filteredPayments);
//   console.log("payments",payments);
//     // Merge and sort all events chronologically
//     const events = [];
//     // Add transactions
//     transactions.forEach(t => {
//       events.push({
//         date: t.transaction_time,
//         type: 'transaction',
//         transaction_id: t.id,
//         total_amount: parseFloat(t.total_amount),
//         paid_amount: parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid || 0),
//         old_debt_paid: parseFloat(t.old_debt_paid || 0),
//         remaining_amount: parseFloat(t.remaining_amount),
//         raw_data: t
//       });
//     });
//     // Add filtered payments only
//     filteredPayments.forEach(p => {
//       events.push({
//         date: p.payment_date,
//         type: 'payment',
//         payment_id: p.id,
//         amount: parseFloat(p.amount),
//         raw_data: p
//       });
//     });
//     // Sort by date ascending
//     events.sort((a, b) => new Date(a.date) - new Date(b.date));
//     // Calculate cumulative debt
//     let cumulativeDebt = 0;
//     const history = [];
//     events.forEach(event => {
//       if (event.type === 'transaction') {
//         // const debtIncrease = event.remaining_amount;
//         console.log("event.total_amount",event.total_amount);
//         console.log("event.total_amount_paid",event.total_amount_paid);
//         const debtIncrease = event.total_amount- event.paid_amount;
//         cumulativeDebt += debtIncrease;
//         history.push({
//           date: event.date,
//           type: 'transaction',
//           transaction_id: event.transaction_id,
//           total_amount: event.total_amount,
//           paid_amount: event.paid_amount,
//           old_debt_paid: event.old_debt_paid,
//           remaining_amount: event.remaining_amount,
//           debt_before: cumulativeDebt - debtIncrease,
//           debt_change: debtIncrease,
//           debt_after: cumulativeDebt,
//           raw_data: event.raw_data
//         });
//       } else if (event.type === 'payment') {
//         const debtDecrease = event.amount;
//         cumulativeDebt -= debtDecrease;
//         history.push({
//           date: event.date,
//           type: 'payment',
//           payment_id: event.payment_id,
//           amount: event.amount,
//           debt_before: cumulativeDebt + debtDecrease,
//           debt_change: -debtDecrease,
//           debt_after: cumulativeDebt,
//           raw_data: event.raw_data
//         });
//       }
//     });
//     // Sort by date descending (الأحدث أولاً)
//     history.sort((a, b) => new Date(b.date) - new Date(a.date));
//     res.json({
//       success: true,
//       data: {
//         buyer,
//         current_debt: parseFloat(buyer.total_debt),
//         calculated_debt: cumulativeDebt,
//         history,
//         summary: {
//           total_sales: transactions.length,
//           total_payments: filteredPayments.length,
//           total_amount_sold: transactions.reduce((sum, t) => sum + parseFloat(t.total_amount), 0),
//           total_amount_paid: transactions.reduce((sum, t) => sum + parseFloat(t.paid_amount) + parseFloat(t.old_debt_paid || 0), 0) + filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
//         }
//       }
//     });
//   } catch (error) { 
//     next(new AppError( 'خطأ في جلب سجل الديون ',));
//   }
// };
exports.getAllBuyers=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function d(a,b,c){var e,f;return _regenerator().w(function(a){for(;1;)switch(a.p=a.n){case 0:return a.p=0,a.n=1,Buyer.findAll({order:[["name","ASC"]]});case 1:e=a.v,b.json({success:!0,data:e}),a.n=3;break;case 2:a.p=2,f=a.v,c(new AppError("\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0646"));case 3:return a.a(2)}},d,null,[[0,2]])}));return function(b,c,d){return a.apply(this,arguments)}}(),exports.getPaginationAllBuyers=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function d(a,b,c){var e,f,g,h,i,j,k,l,m,n,o,p,q;return _regenerator().w(function(d){var r=Math.ceil;for(;1;)switch(d.p=d.n){case 0:return d.p=0,e=a.query,f=e.page,g=void 0===f?1:f,h=e.limit,i=void 0===h?50:h,j=e.search,k=e.has_debt,l=(parseInt(g)-1)*parseInt(i),m={},j&&(m[Op.or]=[{name:_defineProperty({},Op.iLike,"%".concat(j,"%"))},{phone:_defineProperty({},Op.iLike,"%".concat(j,"%"))},{address:_defineProperty({},Op.iLike,"%".concat(j,"%"))}]),console.log("has_debt",k),"true"===k?m.total_debt=_defineProperty({},Op.gt,0):"false"===k&&(m.total_debt=0),d.n=1,Buyer.findAndCountAll({where:m,order:[["name","ASC"]],limit:parseInt(i),offset:l});case 1:n=d.v,o=n.count,p=n.rows,b.json({success:!0,data:{items:p,pagination:{total:o,page:parseInt(g),limit:parseInt(i),total_pages:r(o/parseInt(i))}}}),d.n=3;break;case 2:d.p=2,q=d.v,c(new AppError("\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0646"));case 3:return d.a(2)}},d,null,[[0,2]])}));return function(b,c,d){return a.apply(this,arguments)}}(),exports.getBuyerById=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function d(a,b,c){var e,f;return _regenerator().w(function(d){for(;1;)switch(d.p=d.n){case 0:return d.p=0,d.n=1,Buyer.findByPk(a.params.id);case 1:e=d.v,e||c(new AppError("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u062A\u0631\u064A",404)),b.json({success:!0,data:e}),d.n=3;break;case 2:d.p=2,f=d.v,c(new AppError("\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0646"));case 3:return d.a(2)}},d,null,[[0,2]])}));return function(b,c,d){return a.apply(this,arguments)}}(),exports.createBuyer=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function d(a,b,c){var e,f;return _regenerator().w(function(d){for(;1;)switch(d.p=d.n){case 0:return d.p=0,d.n=1,Buyer.create(a.body);case 1:e=d.v,b.status(201).json({success:!0,message:"\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0634\u062A\u0631\u064A \u0628\u0646\u062C\u0627\u062D",data:e}),d.n=3;break;case 2:d.p=2,f=d.v,c(new AppError("\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0634\u062A\u0631\u064A"));case 3:return d.a(2)}},d,null,[[0,2]])}));return function(b,c,d){return a.apply(this,arguments)}}(),exports.updateBuyer=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function d(a,b,c){var e,f,g,h,i;return _regenerator().w(function(d){for(;1;)switch(d.p=d.n){case 0:return d.p=0,d.n=1,Buyer.findByPk(a.params.id);case 1:return e=d.v,e||c(new AppError("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u062A\u0631\u064A",404)),f=a.body,g=f.total_debt,h=_objectWithoutProperties(f,_excluded),d.n=2,e.update(h);case 2:b.json({success:!0,message:"\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0634\u062A\u0631\u064A \u0628\u0646\u062C\u0627\u062D",data:e}),d.n=4;break;case 3:d.p=3,i=d.v,c(new AppError("\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0634\u062A\u0631\u064A"));case 4:return d.a(2)}},d,null,[[0,3]])}));return function(b,c,d){return a.apply(this,arguments)}}(),exports.deleteBuyer=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function d(a,b,c){var e,f,g;return _regenerator().w(function(d){for(;1;)switch(d.p=d.n){case 0:return d.p=0,d.n=1,Buyer.findByPk(a.params.id);case 1:return e=d.v,e||c(new AppError("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u062A\u0631\u064A",404)),d.n=2,SaleTransaction.count({where:{buyer_id:a.params.id}});case 2:return f=d.v,0<f&&c(new AppError(" \u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u0645\u0634\u062A\u0631\u064A \u0627\u0644\u0630\u064A \u0644\u062F\u064A\u0647 \u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0642\u0627\u0626\u0645\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F ",400)),d.n=3,e.destroy();case 3:b.json({success:!0,message:"\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0634\u062A\u0631\u064A \u0628\u0646\u062C\u0627\u062D"}),d.n=5;break;case 4:d.p=4,g=d.v,c(new AppError("\u062E\u0637\u0623 \u0641\u064A \u062D\u0630\u0641 \u0627\u0644\u0645\u0634\u062A\u0631\u064A "));case 5:return d.a(2)}},d,null,[[0,4]])}));return function(b,c,d){return a.apply(this,arguments)}}(),exports.getBuyerDebtHistory=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function d(a,b,c){var e,f,g,h,i,j,k,l,m,n,o,p,q;return _regenerator().w(function(d){for(;1;)switch(d.p=d.n){case 0:return d.p=0,e=a.params.id,f=parseInt(a.query.limit)||7,d.n=1,Buyer.findByPk(e);case 1:if(g=d.v,g){d.n=2;break}return d.a(2,c(new AppError("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u062A\u0631\u064A",404)));case 2:return d.n=3,SaleTransaction.findAll({where:{buyer_id:e},include:[{model:DailyOperation,as:"operation",attributes:["id","operation_date"]}],order:[["transaction_time","DESC"]],limit:f});case 3:return h=d.v,d.n=4,BuyerDebtPayment.findAll({where:{buyer_id:e},include:[{model:DailyOperation,as:"operation",attributes:["id","operation_date"],required:!1}],order:[["payment_date","DESC"]],limit:f});case 4:i=d.v,j=new Set(h.map(function(a){return new Date(a.transaction_time).toLocaleString("en-GB",{timeZone:"Africa/Cairo"}).getTime()})),k=i.filter(function(a){var b=new Date(a.payment_date).toLocaleString("en-GB",{timeZone:"Africa/Cairo"}).getTime();return!j.has(b)}),l=[],h.forEach(function(a){l.push({date:a.transaction_time,type:"transaction",transaction_id:a.id,total_amount:parseFloat(a.total_amount),paid_amount:parseFloat(a.paid_amount)+parseFloat(a.old_debt_paid||0),old_debt_paid:parseFloat(a.old_debt_paid||0),remaining_amount:parseFloat(a.remaining_amount),raw_data:a})}),k.forEach(function(a){l.push({date:a.payment_date,type:"payment",payment_id:a.id,amount:parseFloat(a.amount),raw_data:a})}),l.sort(function(c,a){return new Date(a.date).toLocaleString("en-GB",{timeZone:"Africa/Cairo"})-new Date(c.date).toLocaleString("en-GB",{timeZone:"Africa/Cairo"})}),m=l.slice(0,f),n=parseFloat(g.total_debt),o=m.map(function(a){var b=n;if("transaction"===a.type){// عند الرجوع للخلف، نطرح الدين اللي اتضاف
var c=a.total_amount-a.paid_amount;return n-=c,{date:a.date,type:"transaction",transaction_id:a.transaction_id,total_amount:a.total_amount,paid_amount:a.paid_amount,old_debt_paid:a.old_debt_paid,remaining_amount:a.remaining_amount,debt_before:n,debt_change:c,debt_after:b,raw_data:a.raw_data}}// عند الرجوع للخلف، نضيف الدفعة (لأننا راجعين)
var d=a.amount;return n+=d,{date:a.date,type:"payment",payment_id:a.payment_id,amount:a.amount,debt_before:n,debt_change:-d,debt_after:b,raw_data:a.raw_data}}),o.sort(function(c,a){return new Date(c.date).toLocaleString("en-GB",{timeZone:"Africa/Cairo"})-new Date(a.date).toLocaleString("en-GB",{timeZone:"Africa/Cairo"})}),p=0<o.length?o[o.length-1].debt_after:parseFloat(g.total_debt),b.json({success:!0,data:{buyer:g,current_debt:parseFloat(g.total_debt),calculated_debt:p,history:o,summary:{total_sales:h.length,total_payments:k.length,total_amount_sold:h.reduce(function(a,b){return a+parseFloat(b.total_amount)},0),total_amount_paid:h.reduce(function(a,b){return a+parseFloat(b.paid_amount)+parseFloat(b.old_debt_paid||0)},0)+k.reduce(function(a,b){return a+parseFloat(b.amount)},0)}}}),d.n=6;break;case 5:d.p=5,q=d.v,console.error("Error in getBuyerDebtHistory:",q),c(new AppError("\u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0633\u062C\u0644 \u0627\u0644\u062F\u064A\u0648\u0646",500));case 6:return d.a(2)}},d,null,[[0,5]])}));return function(b,c,d){return a.apply(this,arguments)}}(),exports.recordDebtPayment=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function d(a,b,c){var e,f,g,h,i,j,k,l,m,n;return _regenerator().w(function(d){for(;1;)switch(d.p=d.n){case 0:return d.n=1,sequelize.transaction();case 1:return e=d.v,d.p=2,f=a.body,g=f.buyer_id,h=f.amount,i=f.payment_date,j=f.notes,k=f.daily_operation_id,d.n=3,Buyer.findByPk(g);case 3:if(l=d.v,l){d.n=5;break}return d.n=4,e.rollback();case 4:c(new AppError("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u062A\u0631\u064A",404));case 5:return d.n=6,BuyerDebtPayment.create({buyer_id:g,daily_operation_id:k||null,amount:h,payment_date:i,notes:j},{transaction:e});case 6:return m=d.v,d.n=7,l.update({total_debt:parseFloat(l.total_debt)-parseFloat(h)},{transaction:e});case 7:return d.n=8,e.commit();case 8:b.status(201).json({success:!0,message:"\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0633\u062F\u0627\u062F \u0627\u0644\u062F\u064A\u0646 \u0628\u0646\u062C\u0627\u062D",data:m}),d.n=11;break;case 9:return d.p=9,n=d.v,d.n=10,e.rollback();case 10:c(new AppError("\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u062E\u0637\u0623 \u0641\u064A \u062A\u0633\u062C\u064A\u0644 \u0633\u062F\u0627\u062F \u0627\u0644\u062F\u064A\u0648\u0646",404));case 11:return d.a(2)}},d,null,[[2,9]])}));return function(b,c,d){return a.apply(this,arguments)}}(),module.exports=exports;