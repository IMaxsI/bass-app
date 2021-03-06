(function() {
  'use strict';

  angular
    .module('bd.app')
    .controller('ProjectController', ProjectController)
    .config(function($locationProvider) {
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: true
      });
    });


  function ProjectController($scope, $timeout, $controller, $http, $window, $location, $mdToast, $mdDialog,
        projectManager, workspace, ReadOnlyStore, ProjectLocalStore, Config) {

    function showNotification(htmlContent) {
      $mdToast.show({
        template:
          '<md-toast>\
            <div class="md-toast-content">{0}</div>\
          </md-toast>'.format(htmlContent),
        position: 'bottom right',
        hideDelay: 2500
      });
    }

    function showSaveNotification(sectionName) {
      showNotification('<span>Section <b>{0}</b> was saved</span>'.format(sectionName));
    }

    function showUploadNotification() {
      showNotification('Project was uploaded');
    }

    function AddTrackController($scope, projectManager, $mdDialog) {
      $scope.close = $mdDialog.hide;
      $scope.instruments = [
        {
          name: 'Bass',
          type: 'bass',
          strings: 'EADG',
        }, {
          name: 'Piano',
          type: 'piano',
          range: ['C2', 'B5'],
        }, {
          name: 'Drums',
          kit: 'Drums',
          type: 'drums'
        }, {
          name: 'Percussions',
          kit: 'Percussions',
          type: 'drums',
          icon: 'percussions'
        }/*, {
          name: 'Bongo',
          kit: 'Bongo',
          type: 'drums',
          icon: ''
        }*/
      ];
      $scope.addTrack = function(trackInfo) {
        projectManager.addTrack(trackInfo);
        $mdDialog.hide(trackInfo);
      }
    }
    $scope.addTrackDialog = function(evt) {

      $mdDialog.show({
        templateUrl: 'views/editor/new_track.html',
        controller: AddTrackController,
        autoWrap: false,
        clickOutsideToClose: true
        // targetEvent: evt
      }).then(function(track) {
        if (track) {
          $scope.ui.selectTrack(track.id);
        }
      });
    };

    $scope.removeTrack = function(trackId) {
      console.log('remove track: '+trackId);

      var track = projectManager.project.tracksMap[trackId];
      if (projectManager.project.tracks.length) {
        var nextSelected = projectManager.project.tracks.find(function(t) {
          return t.type === track.type && t.id !== trackId;
        }) || projectManager.project.tracks[0];
        $scope.ui.selectTrack(nextSelected.id);
        projectManager.removeTrack(trackId);
      } else {
        $mdDialog.show(
          $mdDialog.alert()
            .title("Warning")
            .textContent("You cannot remove last track!")
            .ok("Close")
        );
      }
    }

    $scope.newProject = function() {
      if (projectManager.store.readOnly) {
        projectManager.store = new ProjectLocalStore()
        // $window.history.pushState(null, null, '?');
        $location.hash('');
      }
      document.title = "New Project";
      $scope.project = projectManager.createProject([
        {
          type: 'bass',
          name: 'Bass',
          strings: 'EADG',
          tuning: [0, 0, 0, 0]
        }, {
          type: 'drums',
          kit: 'Drums',
          name: 'Drums'
        }, {
          type: 'drums',
          kit: 'Percussions',
          name: 'Percussions'
        }
      ]);
      var section = projectManager.createSection();
      workspace.selectedSectionId = section.id;
      workspace.section = section;
      projectManager.loadSection(workspace.selectedSectionId);
    };

    $scope.loadProject = function(projectId) {
      $scope.project = projectManager.loadProject(projectId);
      document.title = $scope.project.name;
      workspace.selectedSectionId = $scope.project.sections[0].id;
      projectManager.loadSection(workspace.selectedSectionId);
      workspace.section = projectManager.section;
    };

    function OpenProjectController($scope, $mdDialog, projectManager) {
      $scope.projects = projectManager.store.projectsList();
      if (projectManager.store.project) {
        $scope.openedProjectId = projectManager.store.project.id;
      }
      // $scope.currentProjectId = projectManager.store.project.id;
      $scope.close = $mdDialog.hide;
      $scope.deleteProject = function(projectId) {
        projectManager.store.deleteProject(projectId);
        $scope.projects = projectManager.store.projectsList();
      }
      $scope.openProject = function(projectId) {
        $mdDialog.hide(projectId);
      }
      $scope.importProjectFile = function(file) {
        var projectName = file.filename.replace('.json', '');
        console.log('Importing project: '+projectName);
        var reader = new ReadOnlyStore(JSON.parse(file.content));
        var project = reader.getProject();
        // assign playlists ids
        project.playlists.forEach(function(playlist, index) {
          playlist.id = index + 1;
        });

        var writer = new ProjectLocalStore();
        writer.createProject(projectName);
        project.id = writer.project.id;
        project.name = projectName;
        writer.project = project;
        writer.saveProjectConfig(project.tracks, project.sections);
        project.sections.forEach(function(sectionInfo) {
          var section = reader.getSection(sectionInfo.id);
          writer.saveSection(section.id, section.name, JSON.stringify(section));
        });
        writer.savePlaylists(project.playlists);

        $scope.projects.push({
          id: project.id,
          name: file.filename
        });
        // $scope.projects = projectManager.store.projectsList();
      }
    }

    $scope.openProject = function() {
      if (projectManager.store.readOnly) {
        projectManager.store = new ProjectLocalStore()
        $location.hash('');
      }
      $mdDialog.show({
        templateUrl: 'views/open_project.html',
        controller: OpenProjectController,
        autoWrap: false,
        clickOutsideToClose: false
      }).then(function(projectId) {
        if (projectId) {
          $scope.loadProject(projectId);
        }
      });
    };

    $scope.newSection = function() {
      var section = projectManager.createSection(projectManager.section);
      section.name = 'New';
      workspace.selectedSectionId = section.id;
      projectManager.loadSection(workspace.selectedSectionId);
    };

    $scope.saveSection = function() {
      if (!workspace.section.name) {
        return;
      }
      if (!projectManager.project.name) {
        // Project will be saved into the browser's local storage
        var confirm = $mdDialog.prompt()
          .title('Saving Project')
          .textContent('Please enter project name:')
          .placeholder('Name')
          .ariaLabel('Name')
          .ok('Save')
          .cancel('Cancel');

        $mdDialog.show(confirm).then(function(projectName) {
          if (projectName) {
            document.title = projectName;
            projectManager.project.name = projectName;
            projectManager.saveSection();
            showSaveNotification(workspace.section.name);
          }
        });
      } else {
        projectManager.saveSection();
        showSaveNotification(workspace.section.name);
      }
    }

    $scope.saveAsSection = function() {
      projectManager.saveAsNewSection();
      workspace.section = projectManager.section;
      workspace.selectedSectionId = workspace.section.id;
    };

    $scope.deleteSection = function() {
      projectManager.deleteSection(workspace.selectedSectionId);

      // select another section or create a new section
      if (projectManager.project.sections.length > 0) {
        workspace.selectedSectionId = projectManager.project.sections[0].id;
      } else {
        workspace.selectedSectionId = projectManager.createSection().id;
      }
      projectManager.loadSection(workspace.selectedSectionId);
    };


    $scope.newPlaylist = function() {
      var playlist = projectManager.createPlaylist();
      projectManager.loadPlaylist(playlist.id);
    };

    $scope.savePlaylists = function() {
      if (workspace.playlist.name) {
        projectManager.savePlaylists();
        showNotification('<span>Playlists was saved</span>');
      }
    };

    $scope.deletePlaylist = function() {
      var deletedPlaylistName = workspace.playlist.name;
      projectManager.deletePlaylist(workspace.playlist.id);
      if (!projectManager.store.readOnly) {
        projectManager.savePlaylists();
      }
      showNotification('<span>Playlist <b>{0}</b> was deleted</span>'.format(deletedPlaylistName));
      if (projectManager.project.playlists.length) {
        projectManager.loadPlaylist(projectManager.project.playlists[0].id);
      }
    };

    $scope.itemReorderHandler = function(event, dragItemId, dropItemId, list) {
      var dragItemIndex = list.findIndex(function(item) {
        return item.id === dragItemId;
      });
      var dragItem = list.splice(dragItemIndex, 1)[0];
      var dropItemIndex = list.findIndex(function(item) {
        return item.id === dropItemId;
      });
      list.splice(dropItemIndex, 0, dragItem);
    }

    var projectParam = $location.hash();
    if (projectParam) {
      $http({
        url: Config.dataUrl+projectParam,
        method: 'GET',
        transformResponse: [function (data) {
          if (data[0] !== '{') {
            data = LZString.decompressFromBase64(data);
          }
          return JSON.parse(data);
        }]
      })
      .then(function(response) {
        // console.log(response)
        projectManager.store = new ReadOnlyStore(response.data);
        $scope.project = projectManager.loadProject(1);
        workspace.selectedSectionId = $scope.project.sections[0].id;
        projectManager.loadSection(workspace.selectedSectionId);
      });
    } else {
      if (projectManager.store.projects.length) {
        // open last project
        var startupProject = projectManager.store.projects[0];
        try {
          $scope.loadProject(startupProject.id);
        } catch (ex) {
          var alert = $mdDialog.alert()
            .title('Warning')
            .textContent(
              'Failed to open latest project.'
            )
            .ok('Close');

          $mdDialog.show(alert);
          $scope.newProject();
        }
      } else {
        $scope.newProject();
      }
    }

    $scope.exportProject = function() {
      var data = projectManager.store._projectData();

      var text = JSON.stringify(data);
      var blob = new Blob(
        // [JSON.stringify(data, null, 4)],
        [JSON.stringify(data)],
        // [LZString.compressToBase64(text)],
        // [LZString.compressToUTF16(text)],
        {type: "application/json;charset=utf-8"}
      );

      saveAs(blob, projectManager.project.name);
    };

    $scope.uploadProject = function() {
      // var UploadController = $controller('UploadController', {'$scope': $scope.$new(true)}).constructor;
      window.runtime.loadModule('upload').then(function() {
        $mdDialog.show({
          templateUrl: 'views/upload_form.html',
          controller: 'UploadController',
          autoWrap: false
          // clickOutsideToClose: true
          // targetEvent: evt
        }).then(function(success) {
          if (success) {
            showUploadNotification();
          }
        });
      })
    };

    $scope.importProject = function() {
      $timeout(function() {
        var projectName = $location.path();
        console.log('Importing project: '+projectName)
        var sections = projectManager.project.sections.map(function(sectionInfo) {
          return projectManager.getSection(sectionInfo.id);
        });

        projectManager.store = new ProjectLocalStore();
        projectManager.project.sections = [];
        sections.forEach(function(section) {
          projectManager.project.sections.push(section);
          projectManager.loadSection(section.id);
          projectManager.saveSection();
        });
        projectManager.store.project.upload_id = location.hash.substr(1);
        projectManager.savePlaylists();
        projectManager.saveProjectConfig();

        projectManager.loadSection(sections[0].id);
        workspace.selectedSectionId = projectManager.section.id;

        showNotification('Project Imported');
        location.hash = '';
      });
    };

    workspace._import = function(section, srcBar, srcBeat, destBar, destBeat, count, tracks) {
      var barIndex = srcBar;
      var beatIndex = srcBeat;
      // var tracks = projectManager.project.tracks
      var data = {};
      for (var trackId in section.tracks) {
        data[trackId] = [];
      }
      var destBarIndex = destBar;
      var destBeatIndex = destBeat;
      while (count--) {
        for (var trackId in section.tracks) {
          var track = section.tracks[trackId];
          var beat = angular.copy(track.beat(barIndex, beatIndex));
          beat.bar = destBarIndex;
          beat.beat = destBeatIndex;
          data[trackId].push(beat);
        }
        beatIndex++;
        if (beatIndex > section.timeSignature.top) {
          beatIndex = 1;
          barIndex++;
        }
        destBeatIndex++;
        if (destBeatIndex > section.timeSignature.top) {
          destBeatIndex = 1;
          destBarIndex++;
        }
      }
      // import part
      for (var trackId in workspace.section.tracks) {
        if (tracks && tracks.indexOf(trackId) === -1) {
          console.log('skipping track '+trackId);
          continue;
        }
        var trackSection = workspace.section.tracks[trackId];
        if (trackSection.loadBeats) {
          console.log('importing track beats: '+trackId);
          trackSection.loadBeats(data[trackId]);
        }
      }
    };

    workspace.importBeats = function(sectionName, srcBar, srcBeat, destBar, destBeat, count, tracks) {
      var sectionId = projectManager.project.sections.find(function(s) {
        return s.name === sectionName;
      }).id;
      var section = projectManager.getSection(sectionId);
      workspace._import(section, srcBar, srcBeat, destBar, destBeat, count, tracks);
    };

    workspace.importBars = function(sectionName, srcBar, destBar, count, tracks) {
      var sectionId = projectManager.project.sections.find(function(s) {
        return s.name === sectionName;
      }).id;
      var section = projectManager.getSection(sectionId);
      workspace._import(section, srcBar, 1, destBar, 1, count * section.timeSignature.top, tracks);
    };

    workspace.exportSection = function() {
      if (workspace.section.name) {
        var blob = new Blob(
          [projectManager.serializeSection(projectManager.section)],
          {type: "application/json;charset=utf-8"}
        );
        saveAs(blob, projectManager.section.name);
      }
    }

    $scope.importSectionFromFile = function(file) {
      var section_data = JSON.parse(file.content);
      for (var trackId in section_data.tracks) {
        if (!projectManager.project.tracksMap[trackId]) {
          console.log('NEW TRACK');
          console.log(trackId.split('_'))
          var type = trackId.split('_')[0];
          projectManager.addTrack({
            name: type[0].toUpperCase()+type.substr(1),
            type: type,
          });
        }
      }

      var section = projectManager.loadSectionData(section_data);
      projectManager.importSection(section);
      projectManager.loadSection(section.id);
    }

  }
})();
