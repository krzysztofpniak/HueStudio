const clientId = 'Ao4BMNUK4pc0DMom2A44bADwlrNsGeUl';
const clientSecret = process.env.HUE_CLIENT_SECRET;

const bridgeIp = process.env.HUE_BRIDGE_IP;
const bridgeUsername = process.env.HUE_BRIDGE_USERNAME;
const baseApiUrl = `http://${bridgeIp}/api/${bridgeUsername}`;

export { clientId, clientSecret, baseApiUrl };
