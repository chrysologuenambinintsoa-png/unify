(function () {

    $app.survey.library['cms/oauth.provider.js'] = {
        "text": "OAuth Identity Provider",
        "description": "Register the Single Sign-On identity provider.",
        //"cache": false,
        topics: [
            {
                //text: 'General',
                questions: [
                    {
                        name: "AuthenticationType",
                        text: 'Identity Provider',
                        placeholder: '(select)',
                        tooltip: 'The authentication provider.',
                        required: true,
                        value: null,
                        items: {
                            style: 'RadioButtonList',
                            list: [
                                { value: 'oauth2', text: 'OAuth 2.0' },
                                { value: 'appidentity', text: 'App Identity' },
                                { value: 'facebook', text: 'Facebook' },
                                { value: 'google', text: 'Google' },
                                { value: 'msgraph', text: 'Microsoft Graph' },
                                { value: 'linkedin', text: 'LinkedIn' },
                                { value: 'windowslive', text: 'Windows Live' },
                                { value: 'sharepoint', text: 'SharePoint' },
                                { value: 'identityserver', text: 'Identity Server' },
                                { value: 'dnn', text: 'DotNetNuke' }
                            ]
                        },
                        readOnlyWhen: 'this.AuthenticationType != null',
                        options: {
                            lookup: {
                                openOnTap: true,
                                nullValue: false,
                                autoAdvance: true
                            },
                            text: {
                                style: 'important'
                            }
                        },
                        causesCalculate: true
                    },
                    {
                        name: 'DisplayName',
                        required: true,
                        placeholder: 'The user-friendly name of the identity provider.',
                        tooltip: 'The name of the identity provider displayed in the user interface of the app.',
                        visibleWhen: 'this.AuthenticationType == "oauth2"',
                    },
                    {
                        name: 'Name',
                        text: 'Identifier',
                        placeholder: 'optional',
                        tooltip: 'The unique name of this OAuth 2.0 identity provider is added to the Redirct Uri if specified. Use the alphanumeric characters only.',
                        visibleWhen: 'this.AuthenticationType == "oauth2"',
                        causesCalculate: true
                    },
                    {
                        name: 'GrantType',
                        required: true,
                        items: {
                            style: 'DropDownList',
                            list: [
                                { value: 'authorization_code', text: 'Authorization Code' },
                                { value: 'authorization_code_with_pkce', text: 'Authorization Code (With PKCE)' }
                            ]
                        },
                        options: {
                            lookup: {
                                openOnTap: true,
                                nullValue: false,
                                autoAdvance: true
                            }
                        },
                        visibleWhen: 'this.AuthenticationType == "oauth2"'
                    },
                    {
                        name: 'PublicUri',
                        text: 'Redirect Uri',
                        tooltip: 'Public address of this app that will receive an authorization code from the identity provider.',
                        readOnly: true,
                        visibleWhen: 'this.AuthenticationType != null',
                        options: {
                            text: {
                                style: 'important',
                                action: 'copy'
                            }
                        }
                    },
                    {
                        name: 'RedirectUri',
                        text: 'Alternative Redirect Uri',
                        placeholder: 'Public address of this app.',
                        tooltip: 'The alternative public address of this app that will receive an authorization code from the identity provider. ',
                        required: false, // not required anymore
                        causesCalculate: true,
                        visibleWhen: 'this.AuthenticationType != null'
                    },
                    {
                        name: 'AuthUrl',
                        required: true,
                        placeholder: 'The endpoint that will start the user login process.',
                        tooltip: 'The app will redirect to this URL to authenticate the user.',
                        visibleWhen: 'this.AuthenticationType == "oauth2"'
                    },
                    {
                        name: 'AuthUrlOptions',
                        text: false,
                        tooltip: 'Specify advanced options for the Auth URL.',
                        placeholder: 'options',
                        items: {
                            list: [
                                { value: null, text: 'None' },
                                { value: 'advanced', text: "Advanced Options" }
                            ]
                        },
                        options: {
                            mergeWithPrevious: true,
                            lookup: {
                                nullValue: false,
                                openOnTap: true,
                                autoAdvance: true
                            }
                        },
                        visibleWhen: 'this.AuthenticationType == "oauth2" && this.AuthUrl != null'
                    },
                    {
                        name: 'AuthUrlParameters',
                        text: 'Parameters',
                        rows: 3,
                        placeholder: 'name=value',
                        tooltip: 'List one URL parameter per line as a name=value pair.',
                        options: {
                            mergeWithPrevious: true
                        },
                        visibleWhen: 'this.AuthenticationType == "oauth2" && this.AuthUrl != null && this.AuthUrlOptions == "advanced"'
                    },
                    {
                        name: 'AccessTokenUrl',
                        required: true,
                        placeholder: 'The endpoint that allows this app to collect the access token and determine the user identity.',
                        tooltip: 'The app will use this endpoint of the authorization server to collect the access token and the user identity information.',
                        visibleWhen: 'this.AuthenticationType == "oauth2"'
                    },
                    {
                        name: 'AccessTokenUrlOptions',
                        text: false,
                        tooltip: 'Specify advanced  parameters for the Auth URL.',
                        placeholder: 'options',
                        items: {
                            list: [
                                { value: null, text: 'None' },
                                { value: 'advanced', text: "Advanced Options" }
                            ]
                        },
                        options: {
                            mergeWithPrevious: true,
                            lookup: {
                                nullValue: false,
                                openOnTap: true,
                                autoAdvance: true
                            }
                        },
                        visibleWhen: 'this.AuthenticationType == "oauth2" && this.AccessTokenUrl != null'
                    },
                    {
                        name: 'AccessTokenUrlHeaders',
                        text: 'Token Request Headers',
                        rows: 3,
                        placeholder: 'name=value',
                        tooltip: 'List one header per line as a name=value pair.',
                        options: {
                            mergeWithPrevious: true
                        },
                        visibleWhen: 'this.AuthenticationType == "oauth2" && this.AccessTokenUrl != null && this.AccessTokenUrlOptions == "advanced"'
                    },
                    {
                        name: 'AccessTokenUrlBody',
                        text: 'Token Request Body',
                        rows: 3,
                        placeholder: 'name=value',
                        tooltip: 'List one body parameter per line as a name=value pair.',
                        options: {
                            mergeWithPrevious: true
                        },
                        visibleWhen: 'this.AuthenticationType == "oauth2" && this.AccessTokenUrl != null && this.AccessTokenUrlOptions == "advanced"'
                    },
                    {
                        name: 'AccessTokenUrlRefreshHeaders',
                        text: 'Refresh Request Headers',
                        rows: 3,
                        placeholder: 'name=value',
                        tooltip: 'List one header per line as a name=value pair.',
                        options: {
                            mergeWithPrevious: true
                        },
                        visibleWhen: 'this.AuthenticationType == "oauth2" && this.AccessTokenUrl != null && this.AccessTokenUrlOptions == "advanced"'
                    },
                    {
                        name: 'AccessTokenUrlRefreshBody',
                        text: 'Refresh Request Body',
                        rows: 3,
                        placeholder: 'name=value',
                        tooltip: 'List one body parameter per line as a name=value pair.',
                        options: {
                            mergeWithPrevious: true
                        },
                        visibleWhen: 'this.AuthenticationType == "oauth2" && this.AccessTokenUrl != null && this.AccessTokenUrlOptions == "advanced"'
                    },
                    {
                        name: 'RevokeUrl',
                        placeholder: 'The endpoint that allows this app to revoke the access token.',
                        tooltip: 'The app will post the access token to this endpoint of the authorization server to revoke the token when users sign out.',
                        visibleWhen: 'this.AuthenticationType == "oauth2"'
                    },
                    // the LocalRedirectUri is not needed anymore
                    {
                        name: 'LocalRedirectUri',
                        placeholder: 'Local development URL for testing.',
                        tooltip: 'Used in place of the Redirect Uri when app detects that it is running locally.',
                        causesCalculate: true,
                        visibleWhen: 'this.AuthenticationType != null && !this.AuthenticationType.match(/dnn|sharepoint|appidentity/)',
                        options: { clearOnHide: true },
                        hidden: true
                    },
                    {
                        name: 'SharedDatabase',
                        type: 'bool',
                        items: {
                            style: 'CheckBox'
                        },
                        visibleWhen: 'this.AuthenticationType === "appidentity"',
                        options: {
                            clearOnHide: true
                        }
                    },
                    {
                        name: 'ClientId',
                        required: true,
                        placeholder: 'Unique ID for this application.',
                        tooltip: 'Client identifier used by the identity provider to to recognize this application. The identifier is assigned to the application during the registration by the authorization server.',
                        visibleWhen: 'this.AuthenticationType != null && !this.SharedDatabase'
                    },
                    {
                        name: 'ClientSecret',
                        required: false, // optional for oauth2 with GrantType:authorization_code_with_pkce
                        placeholder: 'Secret key for server-to-server communication.',
                        tooltip: 'Secret value used to authenticate the server-to-server communications. The secret is issued to the application during the registration by the authorization server.',
                        visibleWhen: 'this.AuthenticationType != null && !this.SharedDatabase'
                    },
                    {
                        name: 'ClientUri',
                        text: 'Provider Uri',
                        required: true,
                        placeholder: 'The root URL of the authentication server.',
                        tooltip: 'The web address of the authentication provider.',
                        causesCalculate: true,
                        visibleWhen: 'this.AuthenticationType != null && (this.AuthenticationType.match(/dnn|sharepoint|identityserver|appidentity/))'
                    },
                    {
                        name: 'LocalClientUri',
                        text: 'Local Provider Uri',
                        required: false,
                        placeholder: 'The local root URL of the authentication server.',
                        tooltip: 'The local web address of the authentication provider.',
                        causesCalculate: true,
                        visibleWhen: 'this.AuthenticationType == "appidentity"',
                        options: {
                            clearOnHide: true
                        }
                    },
                    {
                        name: 'TenantID',
                        placeholder: 'ID of the tenant. Enter "common" for general purpose use.',
                        tooltip: 'Identifier of the authentication service used by Microsoft Graph API.',
                        visibleWhen: 'this.AuthenticationType == "msgraph"',
                        options: {
                            clearOnHide: true
                        }
                    },
                    {
                        name: 'CodeChallengeMethod',
                        required: true,
                        items: {
                            style: 'DropDownList',
                            list: [
                                { value: 'S256', text: 'SHA-256' },
                                { value: 'plain', text: 'Plain' }
                            ]
                        },
                        options: {
                            lookup: {
                                openOnTap: true,
                                nullValue: false,
                                autoAdvance: true
                            }
                        },
                        visibleWhen: 'this.AuthenticationType == "oauth2" && this.GrantType == "authorization_code_with_pkce"',
                        tooltip: 'Algorithm used to generate the Code Challenge'
                    },
                    {
                        name: 'CodeVerifier',
                        placeholder: 'Automatically generated if left blank',
                        tooltip: 'A random, 43-128 character sequence used to connect the authorization request to the token request. Enter the following characters: [A-Z], [a-z], [0-9], "-", ".", "_", and "~".',
                        visibleWhen: 'this.AuthenticationType == "oauth2" && this.GrantType == "authorization_code_with_pkce"'
                    },
                    {
                        name: 'Scope',
                        placeholder: 'Specify a space-separated list of scopes. By default, only basic profile, email address, and profile picture are requested.',
                        tooltip: 'Specify additional scopes that will be requested in the authentication request.',
                        visibleWhen: 'this.AuthenticationType != null && this.AuthenticationType != "dnn"',
                        options: { clearOnHide: true }
                    },
                    {
                        name: 'ClientAuthentication',
                        required: true,
                        items: {
                            style: 'DropDownList',
                            list: [
                                { value: 'header', text: 'Send as Basic Auth header' },
                                { value: 'body', text: 'Send client credentials in body' }
                            ]
                        },
                        options: {
                            lookup: {
                                openOnTap: true,
                                nullValue: false,
                                autoAdvance: true
                            }
                        },
                        visibleWhen: 'this.AuthenticationType == "oauth2"',
                        tooltip: 'Describes how the "client_id" and "client_secrect" parameters are specified in the requests to the authorization server.'
                    },
                    {
                        name: 'Tokens',
                        length: 4000,
                        rows: 3,
                        placeholder: 'Specify a space-separated list of tokens.',
                        tooltip: 'List of DotNetNuke tokens that will be queried from the portal and saved to the user profile on login. These tokens can be accessed in business rules.',
                        visibleWhen: 'this.AuthenticationType == "dnn"',
                        options: { clearOnHide: true }
                    },
                    {
                        name: 'ProfileFieldList',
                        placeholder: 'Please enter an optional comma-separated list of fields for the user profile. By default only email field is requested.',
                        tooltip: 'Optional comma-separated list of fields for the user profile. For example, last_name, first_name, name, etc.',
                        visibleWhen: 'this.AuthenticationType == "facebook"',
                        options: { clearOnHide: true }
                    },
                    {
                        name: 'SyncUser',
                        type: 'Boolean',
                        value: true,
                        text: 'Synchronize users',
                        tooltip: 'When enabled, the new users authenticated by the identity provider will have a matching user account created locally if it does not exist already.',
                        visibleWhen: 'this.AuthenticationType != null && this.AuthenticationType != "appidentity"',
                        items: {
                            style: 'CheckBox'
                        }
                    },
                    {
                        name: 'SyncRoles',
                        type: 'Boolean',
                        value: true,
                        text: 'Synchronize roles',
                        tooltip: 'When enabled, roles returned by the provider will be synchronized to the matching local user account.',
                        visibleWhen: 'this.AuthenticationType != null && !this.AuthenticationType.match(/facebook|windowslive|linkedin|appidentity|oauth2/) && this.SyncUser == true',
                        items: { style: 'CheckBox' },
                        options: { clearOnHide: true }
                    },
                    {
                        name: 'AutoLogin',
                        type: 'Boolean',
                        text: 'Force users to login with this provider',
                        tooltip: 'When enabled, anonymous users will be atomatically redirected to login with the identity provider if they navigate to the protected pages of this application.',
                        visibleWhen: 'this.AuthenticationType != null',
                        items: { style: 'CheckBox' }
                    },
                    {
                        name: 'AccessToken',
                        visibleWhen: 'this.AccessToken != null'
                    },
                    {
                        name: 'RefreshToken',
                        visibleWhen: 'this.RefreshToken != null'
                    }
                ]
            }
        ],
        buttons: [
            {
                id: 'a1',
                text: 'Add System Account',
                click: 'oauthregistrationaddsys.cms.app',
                //scope: 'context',
                when: function (e) {
                    return (this.fieldValue('AuthenticationType') || '').match(/sharepoint|google|msgraph|identityserver/);
                }
            }
        ],
        "options": {
            "modal": {
                "fitContent": true,
                "autoGrow": true,
                max: 'sm'
            },
            "materialIcon": "settings_input_antenna",
            "discardChangesPrompt": false
        },
        "init": 'oauthregistrationinit.cms.app',
        "calculate": 'oauthregistrationcalc.cms.app',
        "submit": "oauthregistrationsubmit.cms.app",
        'submitText': Web.DataViewResources.ModalPopup.SaveButton
    };

    function calculatePublicUri(idProvider) {
        var publicUri = new URL(__baseUrl, location.origin).toString();
        if (idProvider != 'appidentity')
            publicUri += 'appservices/saas/' + idProvider;
        else
            publicUri = publicUri.substring(0, publicUri.length - 1);
        return publicUri;
    }

    $(document).on('oauthregistrationinit.cms.app', function (e) {
        //$app.alert($app.survey._data.Text);
        var context = e.survey.context;
        if (context) {
            var authenticationType = context.FileName;
            if (authenticationType && authenticationType.match(/^oauth2/))
                authenticationType = 'oauth2';
            e.rules.updateFieldValue('AuthenticationType', authenticationType);
            if (context.Text) {
                context._skipCalc = true;
                var map = textToConfig(context.Text);
                e.rules.updateFieldValue('ClientId', map.ClientId);
                e.rules.updateFieldValue('ClientSecret', map.ClientSecret);
                e.rules.updateFieldValue('SharedDatabase', !!map.SharedDatabase);
                e.rules.updateFieldValue('LocalClientUri', map.LocalClientUri);
                e.rules.updateFieldValue('ClientUri', map.ClientUri);
                e.rules.updateFieldValue('TenantID', map.TenantID);
                e.rules.updateFieldValue('RedirectUri', map.RedirectUri);
                e.rules.updateFieldValue('LocalRedirectUri', map.LocalRedirectUri);
                e.rules.updateFieldValue('Scope', map.Scope);
                e.rules.updateFieldValue('Tokens', map.Tokens);
                e.rules.updateFieldValue('ProfileFieldList', map.ProfileFieldList);
                e.rules.updateFieldValue('SyncUser', map.SyncUser == 'true');
                e.rules.updateFieldValue('SyncRoles', map.SyncRoles == 'true');
                e.rules.updateFieldValue('AutoLogin', map.AutoLogin == 'true');
                e.rules.updateFieldValue('AccessToken', map.AccessToken);
                e.rules.updateFieldValue('RefreshToken', map.RefreshToken);
                e.rules.updateFieldValue('PublicUri', calculatePublicUri(context.FileName));
                e.rules.updateFieldValue('DisplayName', map.DisplayName);
                e.rules.updateFieldValue('Name', map.Name);
                e.rules.updateFieldValue('GrantType', map.GrantType || 'authorization_code_with_pkce');

                // Auth Url
                e.rules.updateFieldValue('AuthUrl', map.AuthUrl);
                var authUrlOptions;
                if (map.AuthUrlParameters) {
                    authUrlOptions = true;
                    e.rules.updateFieldValue('AuthUrlParameters', valueToMultiLine(map.AuthUrlParameters));
                }
                if (authUrlOptions)
                    e.rules.updateFieldValue('AuthUrlOptions', 'advanced');

                // Access Token Url
                e.rules.updateFieldValue('AccessTokenUrl', map.AccessTokenUrl);
                var accessTokenUrlOptions;
                if (map.AccessTokenUrlHeaders) {
                    accessTokenUrlOptions = true;
                    e.rules.updateFieldValue('AccessTokenUrlHeaders', valueToMultiLine(map.AccessTokenUrlHeaders));
                }
                if (map.AccessTokenUrlBody) {
                    accessTokenUrlOptions = true;
                    e.rules.updateFieldValue('AccessTokenUrlBody', valueToMultiLine(map.AccessTokenUrlBody));
                }
                if (map.AccessTokenUrlRefreshHeaders) {
                    accessTokenUrlOptions = true;
                    e.rules.updateFieldValue('AccessTokenUrlRefreshHeaders', valueToMultiLine(map.AccessTokenUrlRefreshHeaders));
                }
                if (map.AccessTokenUrlRefreshBody) {
                    accessTokenUrlOptions = true;
                    e.rules.updateFieldValue('AccessTokenUrlRefreshBody', valueToMultiLine(map.AccessTokenUrlRefreshBody));
                }
                if (accessTokenUrlOptions)
                    e.rules.updateFieldValue('AccessTokenUrlOptions', 'advanced');

                e.rules.updateFieldValue('RevokeUrl', map.RevokeUrl);
                e.rules.updateFieldValue('ClientAuthentication', map.ClientAuthentication || 'header');
                e.rules.updateFieldValue('CodeChallengeMethod', map.CodeChallengeMethod || 'S256');
                e.rules.updateFieldValue('CodeVerifier', map.CodeVerifier);
            }
            else {
                e.rules.updateFieldValue('GrantType', 'authorization_code_with_pkce');
                e.rules.updateFieldValue('CodeChallengeMethod', 'S256');
                e.rules.updateFieldValue('ClientAuthentication', 'header');
            }

        }

    }).on('oauthregistrationcalc.cms.app', function (e) {
        try {
            var data = e.dataView.data(),
                trigger = e.rules.trigger(),
                context = e.survey.context,
                newUri;
            if (context && context._skipCalc) {
                delete context._skipCalc;
                return;
            }
            if (trigger == 'RedirectUri' && data.RedirectUri) {
                //newUri = validateRedirectUri(data.RedirectUri, data.AuthenticationType);
                //    if (newUri != data.RedirectUri)
                //        e.rules.updateFieldValue('RedirectUri', newUri);
            }
            else if (trigger == 'LocalRedirectUri' && data.LocalRedirectUri) {
                //newUri = validateRedirectUri(data.LocalRedirectUri, data.AuthenticationType, true);
                //if (newUri != data.LocalRedirectUri)
                //    e.rules.updateFieldValue('LocalRedirectUri', newUri);
            }
            else if (trigger == 'ClientUri') {
                //if (data.ClientUri)
                //    $app.touch.notify(data.ClientUri);
            }
            var authenticationType = data.AuthenticationType;
            if (data.Name) {
                var IdPName = $app.prettyText(data.Name).replace(/[^\w]/g, ' ').trim().replace(/\s+/g, '-').toLowerCase();
                if (IdPName != data.Name) {
                    //$app.input.execute({ values: { Name: IdPName }, raiseCalculate: false });
                    e.rules.updateFieldValue('Name', IdPName);
                }
                if (IdPName.length)
                    authenticationType += '-' + IdPName;
            }
            e.rules.updateFieldValue('PublicUri', calculatePublicUri(authenticationType));
        }
        catch (ex) {
            alert(ex);
        }
    }).on('oauthregistrationaddsys.cms.app', function (e) {
        e.preventDefault();
        var data = $app.touch.dataView().data();
        saveConfig(e.survey.context, data, function () {
            location.href = '../appservices/saas/' + data.AuthenticationType + '?storeToken=true&start=%2Fpages%2Fsite-content';
        });
    }).on('oauthregistrationsubmit.cms.app', function (e) {
        e.preventDefault();
        saveConfig(e.survey.context, $app.touch.dataView().data());
    });

    function validateRedirectUri(uri, type, httpOnly) {
        if (typeof uri == 'string') {
            var path = 'appservices/saas/' + type;
            if (!uri.endsWith('/' + path)) {
                var url = new URL(path, uri);
                uri = url.href;
            }
        }
        return uri;
    }

    function saveConfig(context, data, callback) {
        var opts = {
            controller: 'SiteContent',
            values: [{ name: 'Text', newValue: configToText(data) }],
            done: function (result) {
                if (result.errors && result.errors.length)
                    $app.alert(result.errors[0]);
                else if (callback)
                    callback(result);
                else {
                    $app.touch.goBack(function () {
                        $app.touch.dataView().sync(context.SiteContentID || result.SiteContent.SiteContentID);
                    });
                }
            }
        };

        var fileName = data.AuthenticationType;
        if (typeof data.Name == 'string')
            fileName += '-' + data.Name;
        if (context.SiteContentID) {
            opts.view = 'editForm1';
            opts.command = 'Update';
            opts.values.push(
                { name: 'SiteContentID', oldValue: context.SiteContentID },
                { name: 'FileName', newValue: fileName },
                { name: 'Path', value: 'sys/saas ' });
            $app.execute(opts);
        }
        else {
            opts.view = 'createForm1';
            opts.command = 'Insert';
            opts.values.push(
                { name: 'SiteContentID', value: null },
                { name: 'FileName', newValue: fileName },
                { name: 'Path', newValue: 'sys/saas' });

            // check for existing record
            $app.execute({
                controller: 'SiteContent',
                view: 'grid1',
                filter: [
                    { name: 'FileName', value: fileName, op: '=' },
                    { name: 'Path', value: 'sys/saas', op: '=' }
                ],
                done: function (result) {
                    if (result.SiteContent.length > 0)
                        $app.touch.goBack(function () {
                            $app.alert('OAuth registration "sys/saas/' + fileName + '" already exists.');
                        });
                    else
                        $app.execute(opts);
                }
            });
        }
    }
    function NormalizeUrl(url) {
        if (typeof url == 'string')
            try {
                if (!url.match(/^http/i))
                    url = 'http://' + url;
                if (!url.match(/\/$/))
                    url += '/';
                var normalUrl = new URL(url);
                url = normalUrl.toString();
            }
            catch (err) {
                // do nothing
            }
        return url;
    }

    function configToText(data) {
        var lines = [];
        if (data.ClientId)
            lines.push('Client Id: ' + data.ClientId);
        if (data.ClientSecret)
            lines.push('Client Secret: ' + data.ClientSecret);
        if (data.SharedDatabase)
            lines.push('Shared Database: true');
        if (data.RedirectUri)
            lines.push('Redirect Uri: ' + validateRedirectUri(NormalizeUrl(data.RedirectUri), data.AuthenticationType));
        if (data.AuthenticationType != 'dnn' && data.LocalRedirectUri)
            lines.push('Local Redirect Uri: ' + validateRedirectUri(NormalizeUrl(data.LocalRedirectUri), data.AuthenticationType));
        if (data.SyncUser)
            lines.push('Sync User: true');
        if (data.SyncRoles)
            lines.push('Sync Roles: true');
        if (data.AutoLogin)
            lines.push('Auto Login: true');
        if (data.AuthenticationType.match(/dnn|sharepoint|identityserver|appidentity/) && data.ClientUri)
            lines.push('Client Uri: ' + NormalizeUrl(data.ClientUri));
        if (data.AuthenticationType.match(/dnn|sharepoint|identityserver|appidentity/) && data.LocalClientUri)
            lines.push('Local Client Uri: ' + NormalizeUrl(data.LocalClientUri));
        if (data.AuthenticationType == 'msgraph' && data.TenantID)
            lines.push('Tenant ID: ' + data.TenantID);
        if (data.Scope)
            lines.push('Scope: ' + data.Scope);
        if (data.AuthenticationType == 'facebook' && data.ProfileFieldList)
            lines.push('Profile Field List: ' + data.ProfileFieldList);
        if (data.AuthenticationType == 'dnn' && data.Tokens)
            lines.push('Tokens: ' + data.Tokens);
        if (data.AccessToken)
            lines.push('Access Token: ' + data.AccessToken);
        if (data.RefreshToken)
            lines.push('Refresh Token: ' + data.RefreshToken);
        if (data.AuthenticationType == 'oauth2') {
            if (data.DisplayName)
                lines.push('Display Name: ' + data.DisplayName);
            if (data.Name)
                lines.push('Name: ' + data.Name);
            if (data.GrantType)
                lines.push('Grant Type: ' + data.GrantType);
            if (data.AuthUrl) {
                lines.push('Auth Url: ' + data.AuthUrl);
                if (data.AuthUrlOptions == 'advanced') {
                    if (data.AuthUrlParameters)
                        lines.push('Auth Url Parameters: ' + multiLineToValue(data.AuthUrlParameters));
                }
                if (data.AccessTokenUrlOptions == 'advanced') {
                    if (data.AccessTokenUrlHeaders)
                        lines.push('Access Token Url Headers: ' + multiLineToValue(data.AccessTokenUrlHeaders));
                    if (data.AccessTokenUrlBody)
                        lines.push('Access Token Url Body: ' + multiLineToValue(data.AccessTokenUrlBody));
                    if (data.AccessTokenUrlRefreshHeaders)
                        lines.push('Access Token Url Refresh Headers: ' + multiLineToValue(data.AccessTokenUrlRefreshHeaders));
                    if (data.AccessTokenUrlRefreshBody)
                        lines.push('Access Token Url Refresh Body: ' + multiLineToValue(data.AccessTokenUrlRefreshBody));
                }
            }
            if (data.AccessTokenUrl) {
                lines.push('Access Token Url: ' + data.AccessTokenUrl);
            }
            if (data.RevokeUrl)
                lines.push('Revoke Url: ' + data.RevokeUrl);
            if (data.ClientAuthentication)
                lines.push('Client Authentication: ' + data.ClientAuthentication);
            if (data.GrantType == 'authorization_code_with_pkce') {
                if (data.CodeChallengeMethod)
                    lines.push('Code Challenge Method: ' + data.CodeChallengeMethod);
                if (data.CodeVerifier)
                    lines.push('Code Verifier: ' + data.CodeVerifier);
            }
        }

        return lines.join('\n');
    }

    function valueToMultiLine(v) {
        return v ? v.replace(/\;/g, '\n') : null;
    }

    function multiLineToValue(text) {
        return text ? text.trim().replace(/\r?\n+/g, ';') : '';
    }

    function textToConfig(text) {
        var lines = text.split('\n'),
            map = {},
            pendingProp = null;
        for (i in lines) {
            var line = lines[i];
            if (line != '') {
                var j = line.indexOf(':');
                if (pendingProp != null) {
                    map[pendingProp] = line;
                    pendingProp = null;
                }
                else if (j > -1) {
                    var name = line.substring(0, j).replace(/ /g, ''),
                        val = line.substring(j + 1);
                    map[name] = val.trim();
                    if (val.trim() == '')
                        pendingProp = name;
                }
            }
        }
        if (map.ClientUri)
            map.ClientUri = simplyUri(map.ClientUri);
        if (map.LocalClientUri)
            map.LocalClientUri = simplyUri(map.LocalClientUri);
        map.RedirectUri = simplyUri(map.RedirectUri);
        map.LocalRedirectUri = simplyUri(map.LocalRedirectUri);
        return map;
    }

    function simplyUri(uri) {
        if (typeof uri == 'string') {
            var uriInfo = uri.match(/^(.+)?\/appservices\/saas\/\w+$/i);
            if (uriInfo)
                uri = uriInfo[1];
            if (uri.endsWith('/'))
                uri = uri.substring(0, uri.length - 1);
        }
        return uri;
    }
})();