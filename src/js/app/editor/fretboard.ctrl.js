(function() {
  'use strict';

  angular
    .module('bd.app')
    .controller('FretboardController', FretboardController);

  function FretboardController($scope, audioPlayer, workspace, fretboardViewer, $element) {

    $scope.playingStyles = [
      {
        name: 'finger',
        label: 'FINGER'
      }, {
        name: 'slap',
        label: 'SLAP'
      }, {
        name: 'pop',
        label: 'POP'
      }, {
        name: 'pick',
        label: 'PICK'
      }, {
        name: 'tap',
        label: 'TAP'
      }
    ];

    $scope.fretboard = {
      style: 'finger',
      noteLength: 8
    };

    $scope.playBassSound = function(bassSound) {
      var sound = angular.extend({
        start: 0,
        end: bassSound.note.type === 'ghost'? 0.25 : 1,
        style: $scope.fretboard.style,
        volume: 0.75
      }, bassSound);
      audioPlayer.playBassSample(workspace.track, sound);
    };

    $scope.modeChanged = function() {
      fretboardViewer.activate($scope.fretboard.chordMode? $element[0] : null);
    };
  }

})();
