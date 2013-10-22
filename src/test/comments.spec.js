describe('ui.comments', function() {
  var $scope, $document, $body, $compile, comments, firstComment, firstCtrl;
  beforeEach(function() {
    angular.module('testModule', [
      'ui.comments.directive',
      'template/comments/comments.html',
      'template/comments/comment.html'
    ])
    .controller('TestCtrl1', function($scope, $element) {
      this.controllerName = "TestCtrl1";
			this.$element = $element;
    })
    .controller('TestCtrl2', function($scope, $element) {
      this.controllerName = "TestCtrl2";
			this.$element = $element;
    });
    angular.forEach([
      'testModule',
      'ui.comments.directive',
      'template/comments/comments.html',
      'template/comments/comment.html',
    ], function(m) {
      module(m);
    });
  
    inject(function(_$rootScope_, _$document_, _$compile_) {
      $scope = _$rootScope_;
      $document = _$document_;
      $compile = _$compile_;
      $body = $document.find('body');
    });
		firstComment = function() {
			return comments.find('.comment').first();
		}
		firstCtrl = function() {
			return firstComment().controller('comment');
		}
  });


  describe('DOM', function() {
    describe('top-level comments', function() {
      beforeEach(function() {
        $scope.comments = [];
        comments = $compile('<comments comment-data="comments"></comments>')($scope);
      });


      it('adds comment to DOM when comment model grows', function() {
        expect(comments.children().length).toEqual(0);
        $scope.comments.push({});
        $scope.$digest();
        expect(comments.children().length).toEqual(1);
      });


      it('removes comment from DOM when comment model shrinks', function() {
        $scope.comments.push({});
        $scope.$digest();
        expect(comments.children().length).toEqual(1);
        $scope.comments.pop();
        $scope.$digest();
        expect(comments.children().length).toEqual(0);
      });


      it('changes comment data when comment model changes', function() {
        $scope.comments.push({text: 'Test Comment'});
        $scope.$digest();
        expect(comments.find('.comment-body').text()).toEqual("Test Comment");
        $scope.comments[0].text = 'Changed Comment';
        $scope.$digest();
        expect(comments.find('.comment-body').text()).toEqual("Changed Comment");
      });


      it('re-orders comments in DOM when comment model is re-ordered', function() {
        $scope.comments.push({text: '123'});
        $scope.comments.push({text: 'ABC'});
        $scope.$digest();
        expect(comments.find('.comment-body').first().text()).toEqual('123');
        $scope.comments.reverse();
        $scope.$digest();
        expect(comments.find('.comment-body').first().text()).toEqual('ABC');
      });
    });


    describe('child comments', function() {
      beforeEach(function() {
        $scope.comments = [{
          text: 'Comment level 1',
          children: [
            { text: 'First child' },
            { text: 'Second child' }
          ]
        }];
        comments = $compile('<comments comment-data="comments"></comments>')($scope);
        $scope.$digest();
      });


      it('adds comment to DOM when child comment model grows', function() {
        expect(comments.find('.child-comment').length).toEqual(2);
        $scope.comments[0].children.push({text: 'Test'});
        $scope.$digest();
        expect(comments.find('.child-comment').length).toEqual(3);
      });


      it('removes comment from DOM when child comment model shrinks', function() {
        expect(comments.find('.child-comment').length).toEqual(2);
        $scope.comments[0].children.pop();
        $scope.$digest();
        expect(comments.find('.child-comment').length).toEqual(1);
      });


      it('changes comment data when child comment model changes', function() {
        var first = comments.find('.child-comment > .comment-body').first();
        expect(first.text()).toEqual("First child");
        $scope.comments[0].children[0].text = 'Changed Comment';
        $scope.$digest();
        expect(first.text()).toEqual("Changed Comment");
      });


      it('re-orders comments in DOM when child comment model is re-ordered', function() {
        var children = comments.find('.child-comment');
        expect(children.find('.comment-body').first().text()).toEqual('First child');
        $scope.comments[0].children.reverse();
        $scope.$digest();
        expect(children.find('.comment-body').first().text()).toEqual('Second child');
      });
    });
  });


  describe('events', function() {
    it('fires `comments.filled` when child comments become available', function() {
      $scope.comments = [{children: []}];
      comments = $compile('<comments comment-data="comments"></comments>')($scope);
      $scope.$digest();
      var parent = comments.find('.comment').first(),
          callback = jasmine.createSpy('commentsFilled');
      parent.bind('filled.comments', callback);
      $scope.comments[0].children = [{}];
      $scope.$digest();
      expect(callback).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(HTMLDivElement));
    });


    it('fires `comments.emptied` when child comments are no longer available', function() {
      $scope.comments = [{children: [{}]}];
      comments = $compile('<comments comment-data="comments"></comments>')($scope);
      $scope.$digest();
      var parent = comments.find('.comment').first(),
          callback = jasmine.createSpy('commentsEmptied');
      parent.bind('emptied.comments', callback);
      $scope.comments[0].children = [];
      $scope.$digest();
      expect(callback).toHaveBeenCalled();
    });
  });


  describe('custom comment controller', function() {
    var commentsConfig;
    beforeEach(function() {    
      inject(function(_commentsConfig_) {
        commentsConfig = _commentsConfig_;
      });
      $scope.comments = [{}];
    });

    it('instantiates the controller named in commentConfig', function() {
      commentsConfig.commentController = 'TestCtrl1';
      comments = $compile('<comments comment-data="comments"></comments>')($scope);
      $scope.$digest();
      expect(firstCtrl().controllerName).toEqual('TestCtrl1');

      commentsConfig.commentController = 'TestCtrl2';
      comments = $compile('<comments comment-data="comments"></comments>')($scope);
      $scope.$digest();
      expect(firstCtrl().controllerName).toEqual('TestCtrl2');
    });


    it('instantiates the controller function in commentConfig', function() {
      commentsConfig.commentController = function($scope) {
        this.controllerName = 'TestCtrl3';
      };
      comments = $compile('<comments comment-data="comments"></comments>')($scope);
      $scope.$digest();
      expect(firstCtrl().controllerName).toEqual('TestCtrl3');
    });


    it('instantiates the controller function in commentConfig with array annotation', function() {
      commentsConfig.commentController = ['$scope', function(s) {
        this.controllerName = 'TestCtrl4';
      }];
      comments = $compile('<comments comment-data="comments"></comments>')($scope);
      $scope.$digest();
      expect(firstCtrl().controllerName).toEqual('TestCtrl4');
    });


		it('injects the comment $element into controller', function() {
			commentsConfig.commentController = 'TestCtrl2';
			comments = $compile('<comments comment-data="comments"></comments>')($scope);
			$scope.$digest();
			expect(firstComment()[0]).toEqual(firstCtrl().$element[0]);
		});
  });
});
