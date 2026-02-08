"use strict";function _regenerator(){function b(a,b,f,g){var h=b&&b.prototype instanceof d?b:d,c=Object.create(h.prototype);return _regeneratorDefine2(c,"_invoke",function(a,b,g){function h(a,b){for(q=a,s=b,e=0;!w&&t&&!c&&e<v.length;e++){var c,f=v[e],g=p.p,h=f[2];3<a?(c=h===b)&&(s=f[(q=f[4])?5:(q=3,3)],f[4]=f[5]=j):f[0]<=g&&((c=2>a&&g<f[1])?(q=0,p.v=b,p.n=f[1]):g<h&&(c=3>a||f[0]>b||b>h)&&(f[4]=a,f[5]=b,p.n=h,q=0))}if(c||1<a)return m;throw w=!0,b}var k,q,s,t=0,v=g||[],w=!1,p={p:0,n:0,v:j,a:h,f:h.bind(j,4),d:function c(a,b){return k=a,q=0,s=j,p.n=b,m}};return function(c,d,f){if(1<t)throw TypeError("Generator is already running");for(w&&1===d&&h(d,f),q=d,s=f;(e=2>q?j:s)||!w;){k||(q?3>q?(1<q&&(p.n=-1),h(q,s)):p.n=s:p.v=s);try{if(t=2,k){if(q||(c="next"),e=k[c]){if(!(e=e.call(k,s)))throw TypeError("iterator result is not an object");if(!e.done)return e;s=e.value,2>q&&(q=0)}else 1===q&&(e=k["return"])&&e.call(k),2>q&&(s=TypeError("The iterator does not provide a '"+c+"' method"),q=1);k=j}else if((e=(w=0>p.n)?s:a.call(b,p))!==m)break}catch(a){k=j,q=1,s=a}finally{t=1}}return{value:e,done:w}}}(a,f,g),!0),c}function d(){}function g(){}function h(){}function i(a){return Object.setPrototypeOf?Object.setPrototypeOf(a,h):(a.__proto__=h,_regeneratorDefine2(a,l,"GeneratorFunction")),a.prototype=Object.create(c),a}/*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */var j,e,f="function"==typeof Symbol?Symbol:{},k=f.iterator||"@@iterator",l=f.toStringTag||"@@toStringTag",m={};e=Object.getPrototypeOf;var a=[][k]?e(e([][k]())):(_regeneratorDefine2(e={},k,function(){return this}),e),c=h.prototype=d.prototype=Object.create(a);return g.prototype=h,_regeneratorDefine2(c,"constructor",h),_regeneratorDefine2(h,"constructor",g),g.displayName="GeneratorFunction",_regeneratorDefine2(h,l,"GeneratorFunction"),_regeneratorDefine2(c),_regeneratorDefine2(c,l,"Generator"),_regeneratorDefine2(c,k,function(){return this}),_regeneratorDefine2(c,"toString",function(){return"[object Generator]"}),(_regenerator=function a(){return{w:b,m:i}})()}function _regeneratorDefine2(a,b,c,d){var f=Object.defineProperty;try{f({},"",{})}catch(a){f=0}_regeneratorDefine2=function e(a,b,c,d){function g(b,c){_regeneratorDefine2(a,b,function(a){return this._invoke(b,c,a)})}b?f?f(a,b,{value:c,enumerable:!d,configurable:!d,writable:!d}):a[b]=c:(g("next",0),g("throw",1),g("return",2))},_regeneratorDefine2(a,b,c,d)}function asyncGeneratorStep(b,d,f,e,g,h,a){try{var c=b[h](a),i=c.value}catch(a){return void f(a)}c.done?d(i):Promise.resolve(i).then(e,g)}function _asyncToGenerator(b){return function(){var c=this,d=arguments;return new Promise(function(e,f){function g(a){asyncGeneratorStep(i,e,f,g,h,"next",a)}function h(a){asyncGeneratorStep(i,e,f,g,h,"throw",a)}var i=b.apply(c,d);g(void 0)})}}// ========================================
// NEON POSTGRESQL DATABASE CONFIGURATION
// Using Sequelize ORM
// ========================================
var _require=require("sequelize"),Sequelize=_require.Sequelize;require("dotenv").config();// ✅ TWO WAYS TO CONNECT:
// METHOD 1: Using full connection string (RECOMMENDED for Neon)
var sequelize=new Sequelize(process.env.DATABASE_URL,{dialect:"postgres",dialectOptions:{ssl:{require:!0,rejectUnauthorized:!1// Required for Neon
}},logging:!("development"!==process.env.NODE_ENV)&&console.log,pool:{max:5,// Maximum connections
min:0,acquire:3e4,idle:1e4},timezone:"Africa/Cairo",define:{timestamps:!0,underscored:!1,// Keep camelCase (matching your models)
freezeTableName:!0}}),testConnection=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function a(){var b;return _regenerator().w(function(a){for(;1;)switch(a.p=a.n){case 0:return a.p=0,a.n=1,sequelize.authenticate();case 1:return console.log("\u2705 Neon PostgreSQL connection established successfully"),console.log("\uD83D\uDCCA Database: ".concat(sequelize.config.database)),console.log("\uD83C\uDFE0 Host: ".concat(sequelize.config.host)),a.a(2,!0);case 2:return a.p=2,b=a.v,console.error("\u274C Unable to connect to Neon database:",b.message),console.error("\n\uD83D\uDCA1 Troubleshooting:"),console.error("   1. Check DATABASE_URL in .env file"),console.error("   2. Verify Neon project is active (not paused)"),console.error("   3. Check internet connection"),console.error("   4. Ensure SSL is enabled (?sslmode=require)\n"),a.a(2,!1)}},a,null,[[0,2]])}));return function b(){return a.apply(this,arguments)}}(),closeConnection=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function a(){var b;return _regenerator().w(function(a){for(;1;)switch(a.p=a.n){case 0:return a.p=0,a.n=1,sequelize.close();case 1:console.log("\uD83D\uDC4B Database connection closed"),a.n=3;break;case 2:a.p=2,b=a.v,console.error("\u274C Error closing database:",b.message);case 3:return a.a(2)}},a,null,[[0,2]])}));return function b(){return a.apply(this,arguments)}}(),getDatabaseInfo=/*#__PURE__*/function(){var a=_asyncToGenerator(/*#__PURE__*/_regenerator().m(function a(){var b,c;return _regenerator().w(function(a){for(;1;)switch(a.p=a.n){case 0:return a.p=0,a.n=1,sequelize.query("SELECT version() as pg_version, current_database() as db_name, current_user as user",{type:Sequelize.QueryTypes.SELECT});case 1:return b=a.v,a.a(2,b[0]);case 2:return a.p=2,c=a.v,console.error("Error fetching database info:",c),a.a(2,null)}},a,null,[[0,2]])}));return function b(){return a.apply(this,arguments)}}();// METHOD 2: Using separate config (alternative)
/*
const sequelize = new Sequelize(
  process.env.DB_NAME || 'neondb',
  process.env.DB_USER || 'username',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'ep-xxx.region.aws.neon.tech',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: 'Africa/Cairo',
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);
*//**
 * Test database connection
 *//**
 * Close database connection gracefully
 *//**
 * Get database info
 */// Export sequelize instance and utilities
module.exports={sequelize:sequelize,testConnection:testConnection,closeConnection:closeConnection,getDatabaseInfo:getDatabaseInfo,Sequelize:Sequelize// Export Sequelize class for types
};