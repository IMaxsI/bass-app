(function() {
  'use strict';

  angular
    .module('bd.help')
    .controller('HelpBarController', HelpBarController);


  function HelpBarController($scope, $element, $timeout, $mdCompiler, BassSection) {

    $scope.barLabels = {
      3: ['trip', 'let'],
      4: ['e', 'and', 'a']
    };

    var section = {
      timeSignature: {
        top: 4,
        bottom: 4
      },
      length: 2,
      beatsPerView: 3,
      animationDuration: 300,
      beatsPerSlide: 1
    };
    var trackSection = new BassSection(section);
    $scope.workspace = {
      section: section,
      trackSection: trackSection
    };

    $scope.slides = [];
    trackSection.forEachBeat(function(beat) {
      $scope.slides.push({
        id: beat.bar+'_'+beat.beat,
        beat: beat
      });
    });

    function deactivateBackdrop() {
      var backdrop = document.querySelector('.md-menu-backdrop');
      backdrop.style.pointerEvents = 'none';
    }

    var beatElem, timeSigButton;
    $scope.instructions = [
      function() {
        setTimeout($scope.barSwiper.slideTo, 1000, 1, 400);
        setTimeout($scope.barSwiper.slideTo, 2000, 0, 400);
        return 3000;
      },
      function() {}
      ,
      function() {
        $scope.barSwiper.params.slidesPerView = 4;
        $scope.barSwiper.update();
        setTimeout(function() {
          $scope.barSwiper.params.slidesPerView = 5;
          $scope.barSwiper.update();
        }, 400);
      },
      function() {
        $scope.barSwiper.params.slidesPerView = 4;
        $scope.barSwiper.update();
        setTimeout(function() {
          $scope.barSwiper.params.slidesPerView = 3;
          $scope.barSwiper.update();
        }, 400);
      },
      function() {
        $scope.contextMenu = {
          beat: $scope.slides[0].beat
        };
        $mdCompiler.compile({
          templateUrl: 'views/bar_context_menu.html'
        }).then(function(compileData) {
          beatElem = $scope.barSwiper.slides[0];
          beatElem.classList.add('hover');

          var menuElem = compileData.link($scope)[0];
          beatElem.appendChild(menuElem);
          var subdivisionItemElem = menuElem.querySelector('.submenu-trigger-button');
          // open menu
          menuElem.style.position = 'absolute';
          menuElem.style.top = '30px';
          menuElem.style.left = '120px';
          $timeout(function() {
            menuElem.querySelector(':scope > .button').click();
          }, 100);

          $timeout(function() {
            deactivateBackdrop();
            subdivisionItemElem.click();
          }, 300);
        });
        return 3000;
      },
      function() {
        if (beatElem) {
          beatElem.classList.remove('hover');
        }
        var backdrop = document.querySelector('.md-menu-backdrop');
        if (backdrop) {
          backdrop.click();
        }
      },
      function() {
        timeSigButton = $element[0].querySelector('.time-signature-button');
        timeSigButton.classList.add('hover');
        $timeout(timeSigButton.click.bind(timeSigButton), 500);
        $timeout(deactivateBackdrop, 800, false);
        return 2500;
      },
      function() {
        if (beatElem) {
          beatElem.classList.remove('hover');
        }
        if (timeSigButton) {
          timeSigButton.classList.remove('hover');
        }
        var backdrop = document.querySelector('.md-menu-backdrop');
        if (backdrop) {
          backdrop.click();
        }
        $scope.barSwiper.params.slidesPerView = 3;
        $scope.barSwiper.update();
      },
    ];

    var swiperParams = {
      paginationClickable: false,
      pagination: '.swiper-pagination',
      nextButton: '.swiper-button-next',
      prevButton: '.swiper-button-prev',
      spaceBetween: 0,
      direction: 'horizontal',
      slidesPerView: 3,
      slidesPerColumn: 1,
      initialSlide: 0,
      roundLengths: true
    };

    $timeout(function() {
      $scope.barSwiper = new Swiper('.help-container .bar.swiper-container', swiperParams);
    });
  }

})();