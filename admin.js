var myApp = angular.module('mainModule', ['ng-admin']);
myApp.config(['NgAdminConfigurationProvider', function (nga) {
    // create an admin application
    var admin = nga.application('My First Admin')
      .baseApiUrl('http://localhost:3000/'); // main API endpoint
    // create a post entity
    // the API endpoint for this entity will be 'http://localhost:3000/posts/:id
    var post = nga.entity('posts');
    // set the fields of the post entity list view

    post.listView().fields([
        nga.field('id'),
        nga.field('title').isDetailLink(true),
        nga.field('author')
    ]).filters([
      nga.field('q')
        .label('')
        .pinned(true)
        .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span></div>'),
    ]).listActions([
      'show',
      'edit',
      'delete'
    ]);

    post.showView().fields([
        nga.field('id'),
        nga.field('title').isDetailLink(true),
        nga.field('author'),
        nga.field('comments', 'referenced_list')
            .targetEntity(nga.entity('comments'))
            .targetReferenceField('postId')
            .targetFields([
                nga.field('body', 'text')
            ])
            .sortField('id')
            .sortDir('DESC'),
    ]);

    post.creationView().fields([
      nga.field('title').label('Title: ')
        .validation({required: true, minlength: 5, maxlength: 50})
        .attributes({ placeholder: 'Title of the post'}),
      nga.field('author').label('Author: ')
    ]);

    post.editionView().fields(post.creationView().fields());

    admin.addEntity(post);

    var comment = nga.entity('comments');

    comment.listView().fields([
      nga.field('id'),
      nga.field('body', 'text')
        .map(function truncate(value) {
          if(!value) return '';
          return value.length > 50 ? value.substr(0, 50) + '...' : value;
        }),
      nga.field('postId', 'reference')
        .targetEntity(post)
        .targetField(nga.field('title'))
        .label('Post')
    ]).filters([
      nga.field('postId', 'reference')
        .targetEntity(post)
        .targetField(nga.field('title'))
        .label('Post')
        .pinned(true)
    ]).listActions([
      'show',
      'edit'
    ]).batchActions([]);

    comment.creationView().fields([
      nga.field('body').label('Body: '),
      nga.field('postId', 'reference')
        .targetEntity(post)
        .targetField(nga.field('title'))
        .label('Post')
    ]);
    comment.editionView().fields(comment.creationView().fields());

    admin.addEntity(comment);

    admin.menu(nga.menu()
      .addChild(nga.menu(post).icon('<span class="glyphicon glyphicon-user"></span>'))
    );

    // attach the admin application to the DOM and execute it
    nga.configure(admin);
}]);


// DIFFERENT PATTERN OF PAGINATION AND ORDER - TO USE WITH JSON-SERVER
myApp.config(['RestangularProvider', function (RestangularProvider) {
    RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {
        if (operation == "getList") {
            // custom pagination params
            if (params._page) {
                params._start = (params._page - 1) * params._perPage;
                params._end = params._page * params._perPage;
            }
            delete params._page;
            delete params._perPage;
            // custom sort params
            if (params._sortField) {
                params._sort = params._sortField;
                params._order = params._sortDir;
                delete params._sortField;
                delete params._sortDir;
            }
            // custom filters
            if (params._filters) {
                for (var filter in params._filters) {
                    params[filter] = params._filters[filter];
                }
                delete params._filters;
            }
        }
        return { params: params };
    });
}]);
