(function () {
    const siteContentRoot = '~/js/surveys/cms/';
    const siteContentController = __settings.siteContent;
    const identityProviders = {
        'appidentity': 'App Identity',
        'facebook': 'Facebook',
        'google': 'Google',
        'msgraph': 'Microsoft Graph',
        'linkedin': 'Linked In',
        'windowslive': 'Windows Live',
        'sharepoint': 'SharePoint',
        'identityserver': 'Identity Server'
    };
    var _app = $app,
        _touch = _app.touch;

    function selectContent(dataView, args) {
        if (args.commandArgument === 'editForm1' && args.phase === 'before') {
            if (_app.cms.edit(dataView.data()))
                return false;
        }
    }

    _app.rules[siteContentController] = {
        'New': (dataView, args) => {
            _app.cms.new();
            return false;
        },
        'Edit': selectContent,
        'Select': selectContent,
        'Delete': (dataView, args) => {
            if (args.phase === 'before' && _app.cms.delete(dataView.data()))
                return false;
        }
    };


    _app.cms = {
        contentTypes: {
            'sys/api': {
                survey: 'api/api-wizard',
                text: 'API Registration'
            },
            'sys/rules/': {
                survey: 'rules/rule-wizard',
                text: 'Business Rule'
            },
            'sys/oauth2/apps': {
                survey: 'oauth.client-app.js',
                also: 'oauth.client-app.1.0.css',
                text: 'Identity Consumer',
                delete: 'oauth_clientapp_delete.app'
            },
            'sys/saas': {
                survey: 'oauth.provider.js',
                text: 'Identity Provider'
            }
        },
        edit: function (data) {
            if (_touch) {
                var path = data.Path;
                if (path) {
                    for (var pathTest in cmsContentTypes)
                        if (path.startsWith(pathTest)) {
                            _app.survey({
                                controller: 'cms/' + cmsContentTypes[pathTest].survey,
                                also: cmsContentTypes[pathTest].also ? (siteContentRoot + cmsContentTypes[pathTest].also) : null,
                                context: data
                            });
                            return true;
                        }
                    if (path.match(/^sys\/cors\//)) {
                        var corsInfo = JSON.parse(data.Text);
                        $app.execute({
                            controller: siteContentController,
                            filter: {
                                Path: 'sys/oauth2/apps',
                                FileName: corsInfo.client_id + '.json'
                            }
                        }).then(result => {
                            if (result.SiteContent.length)
                                _app.cms.edit(result.SiteContent[0])
                        });
                        return true;
                    }
                }
            }
        },
        delete: function (data) {
            if (_touch) {
                var path = data.Path;
                for (var pathTest in cmsContentTypes)
                    if (path && path.startsWith(pathTest) && cmsContentTypes[pathTest].delete) {
                        $app.getScript(siteContentRoot + cmsContentTypes[pathTest].survey, { also: cmsContentTypes[pathTest].also ? (siteContentRoot + cmsContentTypes[pathTest].also) : null })
                            .then(function () {
                                $(document).trigger($.Event(cmsContentTypes[pathTest].delete, { object: data }));
                            });
                        return true;
                    }
            }
        },
        new: function () {
            var list = [{ value: '$custom', text: '(custom)' }];
            for (var k in cmsContentTypes)
                list.push({ value: k, text: cmsContentTypes[k].text });
            if (_touch)
                _app.survey({
                    text: 'Content',
                    text2: 'New',
                    questions: [
                        {
                            name: 'NewContent',
                            text: false,
                            value: '$custom',
                            required: true,
                            items: {
                                style: 'ListBox',
                                list: list
                            },
                            rows: 10
                        }
                    ],
                    options: {
                        materialIcon: 'note_add',
                        modal: {
                            fitContent: true,
                            max: 'tn',
                            always: true
                        },
                        contentStub: false,
                        discardChangesPrompt: false
                    },
                    submit: 'sitecontentnew.cms.app'
                });
        }
    };

    var cmsContentTypes = _app.cms.contentTypes;

    $(document).on('sitecontentnew.cms.app', function (e) {
        var data = e.dataView.data();
        $app.touch.whenPageShown(function () {
            if (data.NewContent === '$custom') {
                $app.touch.show({
                    controller: siteContentController,
                    startCommand: 'New',
                    startArgument: 'createForm1',
                    done: function (dataView) {
                        var data = dataView.data();
                        $app.touch.dataView().sync(data[__settings.siteContentPK]);
                    }
                });
            }
            else {
                var contentType = cmsContentTypes[data.NewContent];
                $app.survey({
                    controller: 'cms/' + contentType.survey,
                    also: contentType.also ? (siteContentRoot + contentType.also) : null,
                    context: {}
                });
            }

        });
    }).on('getpagecomplete.dataview.app', function (e) {
        var response = e.response;
        if (response.Controller === siteContentController && response.View === 'grid1') {
            var dataView = e.dataView;
            var pathFieldIndex = -1;
            var textFieldIndex = -1;
            var fileNameIndex = -1;
            var fieldList = response.Fields;
            var descriptionField = null;
            if (!fieldList || !fieldList.length) {
                fieldList = dataView._fields;
                descriptionField = dataView.findField('ObjectDescription');
            }
            fieldList.forEach(function (f, index) {
                if (f.Name === 'Path')
                    pathFieldIndex = index;
                if (f.Name === 'Text')
                    textFieldIndex = index;
                if (f.Name === 'FileName')
                    fileNameIndex = index;
            });
            if (pathFieldIndex != -1 && textFieldIndex != -1 && fileNameIndex != -1) {
                if (!descriptionField)
                    response.Fields.splice(0, 0, { Name: 'ObjectDescription', HeaderText: 'Description', Type: 'String', ReadOnly: true, AllowQBE: false, AllowSorting: false });
                response.Rows.forEach(function (row) {
                    var path = row[pathFieldIndex + (descriptionField ? - 1 : 0)];
                    var text = row[textFieldIndex + (descriptionField ? - 1 : 0)];
                    var filename = row[fileNameIndex + (descriptionField ? - 1 : 0)];
                    var v = null;
                    if (path)
                        try {
                            var data = text || '{}';
                            if (data.match(/\{/))
                                data = JSON.parse(text);
                            // analyze the path and data
                            if (path.match(/sys\/cors\//)) {
                                v = `'${data['app']}' CORs data`;
                            }
                            if (path === 'sys/saas') {
                                v = `'${identityProviders[filename] || filename}' identity provider`;
                            }
                            if (path.match(/sys\/oauth2\/apps/)) {
                                v = `'${data['name']}' identity consumer`;
                            }
                            else if (path.match(/sys\/users/) && filename) {
                                var userinfo = filename.match(/^(.+?)\.(\w+)$/);
                                if (userinfo) {
                                    if (filename.match(/\.json$/))
                                        v = `'${userinfo[1]}' identity provider tokens`;
                                    else
                                        v = `'${userinfo[1]}' picture`;;
                                }
                            }
                            else if (path.match(/sys\/oauth2\/pictures\//)) {
                                v = `'${data['username']}' picture claim`;
                            }
                            else if (path.match(/sys\/oauth2\/tokens\//)) {
                                var token = path.match(/sys\/oauth2\/tokens\/(.+?)\/(\w+)$/);
                                if (token)
                                    v = `'${token[1]}' ${token[2]} token`;
                            }
                            else if (path === 'sys/oauth2/appidentity') {
                                v = `'${data['app_name']}' identity request`;
                            }
                            else if (path === 'sys/oauth2/generic') {
                                v = `'${data['app_name']}' identity request`;
                            }
                            else if (path === 'sys/oauth2/requests') {
                                v = `'${data['name']}' authorization request`;
                            }
                            else if (path === 'sys/oauth2/codes') {
                                v = `'${data['name']}' authorization code`;
                            }
                        }
                        catch (ex) {
                            v = ex.message;
                        }
                    row.splice(0, 0, v);
                });
            }
        }
    });

})();