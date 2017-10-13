(function() {
  'use strict';

  angular
    .module('bd.app')
    .factory('pianoEditor', pianoEditor)
    .controller('PianoController', PianoController)

    .component('pianoBeat', {
      scope: false,
      templateUrl: 'views/editor/piano_beat.html',
      bindings: {
        beat: '<',
        instrument: '<'
      },
      controller: 'PianoController as vm'
    });


  function pianoEditor(workspace, Notes, SoundSelector, ResizeHandler, DragHandler) {
    var selector = new SoundSelector();

    class PianoResizeHandler extends ResizeHandler {

      beforeResize(sound, info) {
        selector.select({target: info.element[0]}, sound);
        selector.last.element.appendChild(this.resizeBox.elem);
      }

    }

    class PianoDragHandler extends DragHandler {

      validateDrop(beat, key) {
        if (this.dragChannel === 'instrument') {
          return key.octave === this.dragSound.note.octave && key.label[0] === this.dragSound.note.name;
        }
        return true;
      }

      updateDropSound(sound, beat, note) {
        // console.log('--- updateDropSound ---');
        var isFlat = sound.note.name[1] === '♭';
        sound.note.name = note.label[(isFlat && note.label[1])? 1 : 0];
        sound.note.octave = note.octave;
        sound.string = note.label[0] + note.octave;
      }

      onDragStart(evt) {
        if (this.dragChannel !== 'instrument') {
          selector.select(evt, this.dragSound);
        }
      }

      onDragEnd(evt, sound) {
        selector.select(evt, sound);
      }
    }


    function transpose(sound, step) {
      var piano = workspace.track.instrument;
      var index = piano.stringIndex(sound.note);
      var transposedNote = piano.notes.list[index + step];
      if (transposedNote) {
        sound.note.name = transposedNote.label[0];
        sound.note.octave = transposedNote.octave;
        sound.string = sound.note.name + sound.note.octave;
      }
      console.log(index)
    }

    return {
      selector: selector,
      resizeHandler: new PianoResizeHandler(),
      dragHandler: new PianoDragHandler('piano'),
      keyPressed: function(evt) {
        var sound = selector.last.sound;
        console.log(evt.keyCode)
        if (sound) {
          switch (evt.keyCode) {
            case 46: // Del
              selector.forSelectedSound(workspace.trackSection.deleteSound);
              break;
            case 84: // t
              console.log(JSON.stringify(sound));
              var prevSound = workspace.trackSection.prevSound(sound);
              if (prevSound) {
                sound.prev = true;
                prevSound.next = true;
              }
              break;
            case 76: // l
              if (sound.note.name.endsWith('♯')) {
                sound.note.name = Notes.toFlat(sound.note.name);
              } else if (sound.note.name.endsWith('♭')) {
                sound.note.name = Notes.toSharp(sound.note.name);
              }
              evt.preventDefault();
              return false;
            case 190: // .
              sound.note.staccato = !sound.note.staccato;
              break;
            case 109: // -
              elector.forSelectedSound((sound) => {
                sound.volume = Math.max(0, parseFloat((sound.volume-0.05).toFixed(2)));
                console.log(sound.volume);
              });
              break;
            case 107: // +
              selector.forSelectedSound((sound) => {
                sound.volume = Math.min(1.0, parseFloat((sound.volume+0.05).toFixed(2)));
                console.log(sound.volume);
              });
              break;
             case 38: // up
              selector.forSelectedSound((sound) => {
                transpose(sound, 1);
              }, this);
              break;
             case 40: // down
              selector.forSelectedSound((sound) => {
                transpose(sound, -1);
              }, this);
              break;
            case 37: // left
              workspace.trackSection.offsetSound(sound, -0.01);
              break;
            case 39: // right
              workspace.trackSection.offsetSound(sound, 0.01);
              break;

            // just for debugging
            case 78: // n
              var n = workspace.trackSection.nextSound(sound)
              console.log(n)
              break;
            case 80: // p
              var prev = workspace.trackSection.prevSound(sound);
              if (prev) {
                console.log('OK');
              }
              break;
          }
          evt.preventDefault();
        }
      }
    };
  }

  function PianoController($scope, pianoEditor) {
    $scope.clickHandler = pianoEditor.selector;
    $scope.dragHandler = pianoEditor.dragHandler;
    $scope.resizeHandler = pianoEditor.resizeHandler;
  }

})();