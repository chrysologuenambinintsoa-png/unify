(function () {
    const resources = Web.DataViewResources;
    const appIdentityPath = '/appservices/saas/appidentity';

    $app.survey.library['cms/oauth.client-app.js'] = {
        text: "OAuth Identity Consumer",
        description: "Register a client app for OAuth 2.0 authorization.",
        topics: [
            {
                //text: 'General',
                questions: [
                    {
                        name: 'Name',
                        required: true,
                        length: 250,
                        placeholder: 'A user-friendly name of the client app.',
                        readOnlyWhen: whenClientAppSaved
                    },
                    {
                        name: 'Author',
                        required: true,
                        length: 250,
                        placeholder: 'The name of the app manufacturer.',
                        readOnlyWhen: whenClientAppSaved,
                    },
                    {
                        name: 'RedirectUri',
                        required: true,
                        length: 250,
                        placeholder: 'The URI of the app in production that will collect the access token.',
                        readOnlyWhen: whenClientAppSaved
                    },
                    {
                        name: 'LocalRedirectUri',
                        required: false,
                        length: 250,
                        placeholder: 'The URI of the app in development.',
                        readOnlyWhen: whenClientAppSaved
                    },
                    {
                        name: 'AuthUri',
                        text: 'Auth Uri',
                        tooltip: 'This endpoint starts the authorization flow initiated by the client app to obtain an access token.',
                        readOnly: true,
                        options: {
                            text: {
                                action: 'copy'
                            }
                        },
                        visibleWhen: '$row.ClientId != null && this.Protocol == "oauth"'
                    },
                    {
                        name: 'AccessTokenUri',
                        text: 'Access Token Uri',
                        tooltip: 'This endpoint is used by the client app to get and refresh the access token.',
                        readOnly: true,
                        options: {
                            text: {
                                action: 'copy'
                            }
                        },
                        visibleWhen: '$row.ClientId != null && this.Protocol == "oauth"'
                    },
                    {
                        name: 'ClientId',
                        readOnly: true,
                        visibleWhen: '$row.ClientId != null',
                        options: {
                            textAction: 'copy'
                        }
                    },
                    {
                        name: 'ClientSecret',
                        readOnly: true,
                        visibleWhen: '$row.ClientSecret != null',
                        options: {
                            textAction: 'copy'
                        }
                    },
                    {
                        name: 'PublicUri',
                        text: 'Provider Uri',
                        tooltip: 'The public address of this application containing the endpoints used to configure the Auth Uri and Access Token Uri for the client apps. The hypermedia controls provide the links to the available endpoints.',
                        readOnly: true,
                        options: {
                            text: {
                                action: 'copy'
                            }
                        },
                        visibleWhen: '$row.ClientId != null'
                    },
                    {
                        name: 'Protocol',
                        required: true,
                        items: {
                            style: 'RadioButtonList',
                            list: [
                                { value: 'appidentity', text: 'App Identity' },
                                { value: 'oauth', text: 'OAuth 2.0' }
                            ]
                        },
                        //readOnlyWhen: whenClientAppSaved,
                        readOnlyWhen: '$row.Status === \'Saved\' || $row.ClientId != null'
                    },
                    {
                        name: "Authorization",
                        items: {
                            style: 'CheckBoxList',
                            list: [
                                { value: 'native', text: 'Native' },
                                { value: 'spa', text: 'Single Page App' },
                                { value: 'server', text: 'Server-to-Server' },
                                { value: 'device', text: 'Device' },
                            ]
                        },
                        options: {
                            lookup: {
                                nullValue2: false
                            }
                        },
                        readOnlyWhen: whenClientAppSaved,
                        visibleWhen: whenProtocolIsOAuth
                    },
                    {
                        name: 'Trusted',
                        type: 'bool',
                        items: { style: 'CheckBox' },
                        readOnlyWhen: whenClientAppSaved,
                        visibleWhen: whenProtocolIsOAuth
                    },
                    {
                        name: 'Status',
                        hidden: true
                    }
                ]
            }
        ],
        "options": {
            "modal": {
                "fitContent": true,
                "autoGrow": true,
                max: 'sm'
            },
            "materialIcon": "app_registration",
            "discardChangesPrompt": false
        },
        buttons: [
            {
                id: 'a1',
                text: resources.ModalPopup.SaveButton,
                trigger: 'oauth_clientapp_submit.app',
                when: whenClientAppNotSaved
            },
            {
                id: 'a2',
                text: resources.Actions.Scopes.Form.Delete.HeaderText,
                trigger: 'oauth_clientapp_deleterequest.app',
                confirmation: resources.Actions.Scopes.Form.Delete.Confirmation,
                when: (dataView) => dataView.fieldValue('ClientId') != null,
                causesValidation: false
            },
            {
                id: 'a3',
                text: resources.ModalPopup.CancelButton,
                trigger: 'oauth_clientapp_cancel.app',
                when: whenClientAppNotSaved,
                causesValidation: false
            },
            {
                id: 'a4',
                text: resources.ModalPopup.Close,
                trigger: 'oauth_clientapp_cancel.app',
                when: whenClientAppSaved,
                causesValidation: false
            }
        ],
        "init": 'oauth_clientapp_init.app',
        "calculate": 'oauth_clientapp_calc.app',
        "submit2": "oauth_clientapp_submit.app",
        'submitText': resources.ModalPopup.SaveButton,
        cancel: false
    }

    function whenClientAppSaved() {
        return this.fieldValue('Status') === 'Saved';
    }

    function whenClientAppNotSaved() {
        return this.fieldValue('Status') !== 'Saved';
    }


    function whenProtocolIsOAuth() {
        return this.fieldValue('Protocol') === 'oauth';
    }

    function appIdentityUrl(url, add) {
        if (url) {
            if (arguments.length === 1)
                return url.endsWith(appIdentityPath);
            if (add && !url.endsWith(appIdentityPath)) {
                if (url.endsWith('/'))
                    url = url.substring(0, url.length - 1);
                url += appIdentityPath
            }
            else if (!add && url.endsWith(appIdentityPath))
                url = url.substring(0, url.length - appIdentityPath.length);
        }
        return url;
    }

    $(document)
        .on('oauth_clientapp_init.app', e => {
            var context = e.survey.context,
                appReg = JSON.parse(context.Text || '{"authorization": {}}'),
                auth = appReg.authorization,
                authList = [];

            // debug start
            //if (!appReg.name) {
            //    appReg.name = 'John\'s app';
            //    appReg.author = 'John Doe';
            //    appReg.redirect_uri = 'https://localhost:8376/appservices/saas/appidentity';
            //}
            // debug end


            if (auth.native)
                authList.push('native');
            if (auth.spa)
                authList.push('spa');
            if (auth.server)
                authList.push('server');
            if (auth.device)
                authList.push('device');

            var protocol = 'oauth';
            if (appIdentityUrl(appReg.redirect_uri)) {
                protocol = 'appidentity';
                appReg.redirect_uri = appIdentityUrl(appReg.redirect_uri, false);
                if (appIdentityUrl(appReg.local_redirect_uri))
                    appReg.local_redirect_uri = appIdentityUrl(appReg.local_redirect_uri, false);
            }

            $app.input.execute({
                Name: appReg.name,
                Author: appReg.author,
                ClientId: appReg.client_id,
                ClientSecret: appReg.client_secret,
                RedirectUri: appReg.redirect_uri,
                LocalRedirectUri: appReg.local_redirect_uri,
                Protocol: protocol,
                Authorization: authList.join(','),
                Trusted: !!appReg.trusted
            });
            var publicUri = new URL(__baseUrl, location.origin).toString();
            if (publicUri.endsWith('/'))
                publicUri = publicUri.substring(0, publicUri.length - 1);
            if (protocol != 'appidentity')
                publicUri += "/oauth2/v2";
            e.rules.updateFieldValue('PublicUri', publicUri);
            e.rules.updateFieldValue('AuthUri', publicUri + '/auth');
            e.rules.updateFieldValue('AccessTokenUri', publicUri + '/token');

        }).on('oauth_clientapp_calc.app', e => {

        }).on('oauth_clientapp_submit.app', e => {
            var context = e.survey.context,
                data = e.dataView.data(),
                isAppIdentity = data.Protocol === 'appidentity',
                auth = isAppIdentity ? 'server' : data.Authorization || '',
                body = {
                    name: data.Name,
                    author: data.Author,
                    redirect_uri: isAppIdentity ? appIdentityUrl(data.RedirectUri, true) : data.RedirectUri,
                    local_redirect_uri: isAppIdentity ? appIdentityUrl(data.LocalRedirectUri, true) : data.LocalRedirectUri,
                    authorization: {
                        native: !!auth.match(/native/),
                        spa: !!auth.match(/spa/),
                        server: !!auth.match(/server/),
                        device: !!auth.match(/device/),
                    },
                    trusted: isAppIdentity ? true : data.Trusted
                };

            function clientAppSaved(appReg) {
                $app.touch.busy(false);
                $app.input.execute({
                    Status: 'Saved',
                    RedirectUri: appIdentityUrl(appReg.redirect_uri, false),
                    LocalRedirectUri: appIdentityUrl(appReg.local_redirect_uri, false),
                    ClientId: appReg.client_id,
                    ClientSecret: appReg.client_secret
                });
                $app.touch.notify({ text: String.format(resources.Actions.Scopes.Form.Insert.Notify, appReg.name), duration: 'medium' });
            }

            $app.touch.busy(true);
            if (context.SiteContentID) {
                var appReg = JSON.parse(context.Text);
                // update the existing 
                $app.restful({
                    hypermedia: `oauth2 >> apps >> ${appReg.client_id} >> edit >>`,
                    body
                })
                    .then(appReg =>
                        clientAppSaved(appReg)
                    )
                    .catch(restfulException);
            }
            else
                $app.restful({
                    hypermedia: "oauth2 >> apps >> create >>",
                    body
                })
                    .then(appReg => {
                        $app.execute({
                            controller: 'SiteContent',
                            filter: {
                                Path: 'sys/oauth2/apps',
                                FileName: appReg.client_id + '.json'
                            }
                        }).then(result => {
                            if (result.SiteContent.length) {
                                //context.SiteContentID = result.SiteContent[0].SiteContentID;
                                e.survey.context = result.SiteContent[0];
                                clientAppSaved(appReg);
                            }
                        });
                    })
                    .catch(restfulException);
            return false;
        }).on('oauth_clientapp_cancel.app', e => {
            var context = e.survey.context,
                data = e.dataView.data();
            $app.touch.goBack(() => {
                if (data.Status === 'Saved')
                    $app.touch.dataView().sync(context.SiteContentID)
            });

            return false;
        }).on('oauth_clientapp_deleterequest.app', e => {
            $app.touch.goBack(() =>
                $(document).trigger($.Event('oauth_clientapp_delete.app', { object: e.survey.context })));
            return false;
        }).on('oauth_clientapp_delete.app', e => {
            var appReg = JSON.parse(e.object.Text);
            $app.restful({
                hypermedia: `oauth2 >> apps >> ${appReg.client_id} >> delete >>`
            })
                .then(() => {
                    $app.touch.dataView().sync();
                    $app.touch.notify({ text: String.format(resources.Actions.Scopes.Form.Delete.Notify.replace('$selected', '0'), appReg.name), duration: 'medium' });
                })
                .catch(restfulException)
        });

    function restfulException(ex) {
        $app.touch.busy(false);
        $app.alert(ex.errors ? ex.errors[0].message : ex.message);
    }

})();