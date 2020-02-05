"use strict";

module.exports = {
	env: {
		doc: "The application environment.",
		format: ["development", "test", "production"],
		default: "development",
		env: "NODE_ENV",
		arg: "node-env"
	},
	port: {
		doc: "The port to bind to.",
		format: "port",
		default: 3000,
		env: "PORT",
		arg: "port"
	},
	etApp: {
		applicationId: {
			doc: "ET App ID",
			default: "",
			env: "ET_APP_ID"
		},
		appSignature: {
			doc: "ET App Signature",
			default: "",
			env: "ET_APP_SIGNATURE"
		},
		clientId: {
			doc: "ET Client ID",
			default: "",
			env: "ET_CLIENT_ID"
		},
		clientSecret: {
			doc: "ET Client Secret",
			default: "",
			env: "ET_CLIENT_SECRET"
		},
		stack: {
			doc: "ET Stack",
			default: "",
			env: "ET_STACK"
		}
	},
	S6: {
		authUrl: {
			doc: "ET S6 Auth URL",
			default: "https://auth.exacttargetapis.com/v1/requestToken?legacy=1",
			env: "ET_S6_AUTH_URL"
		},
		fuelapiRestHost: {
			doc: "ET S6 Rest Host",
			default: "www.exacttargetapis.com",
			env: "ET_S6_REST_HOST"	
		},
		baseUrl: {
			doc: "ET S6 base URL",
			default: "https://mc.s6.exacttarget.com/rest/",
			env: "ET_S6_BASE_URL"
		},
		soapEndpoint: {
			doc: "ET S6 Soap Endpoint",
			default: "https://webservice.s6.exacttarget.com/Service.asmx",
			env: "ET_S6_SOAP_ENDPOINT"
		}
	},
	S7: {
		authUrl: {
			doc: "ET S7 Auth URL",
			default: "https://auth.exacttargetapis.com/v1/requestToken?legacy=1",
			env: "ET_S7_AUTH_URL"
		},
		fuelapiRestHost: {
			doc: "ET S7 Rest Host",
			default: "www.exacttargetapis.com",
			env: "ET_S7_REST_HOST"	
		},
		baseUrl: {
			doc: "ET S7 base URL",
			default: "https://mc.s7.exacttarget.com/rest/",
			env: "ET_S7_BASE_URL"
		},
		soapEndpoint: {
			doc: "ET S7 Soap Endpoint",
			default: "https://webservice.s7.exacttarget.com/Service.asmx",
			env: "ET_S7_SOAP_ENDPOINT"
		}
	}
};