dojo.require('esri.arcgis.Portal');
dojo.require('esri.arcgis.utils');
dojo.require("esri.map");
dojo.require('esri.dijit.Attribution');

var portal, items;
var webmaps = [], map, currentMap = 0;
var i18n;

function init() {
    portal = new esri.arcgis.Portal('http://www.arcgis.com');
    dojo.connect(portal, 'onLoad', loadPortal);
}

function loadPortal() {
    //query the group and retrieve the Web Maps.
      var params = {
          q: 'title:Iasess Dingle'
      };
      portal.queryGroups(params)
      .then(function (response) {
		if (response.results.length > 0) {
		    var group = response.results[0];
		    var queryParams = {
			q: 'type:"Web Map" -type:"Web Mapping Application"',
			num: 10
		    };
		    group.queryItems(queryParams)
		    .then(function (response) {
			      if (response.results.length > 0) {
				  items = response.results;
				  //load the first map 
				  createMap(items[0]);
				  //create thumbnail gallery 
				  createThumbs(items);
			      } else {
				  console.log('This group does not contain any public web maps to display.');
				  esri.hide(dojo.byId('loadingImg'));
			      }
			      
			  });
		} else {
		    esri.hide(dojo.byId('loadingImg'));
		}
	    });
}

function createMap(item) {
    var mapDeferred = esri.arcgis.utils.createMap(item.id, dojo.create('div', {
	id: item.id
    }, dojo.byId('mainMap')), {
	mapOptions: {
	    showAttribution: true,
	    slider: false
	}
    });
    mapDeferred.then(function (response) {
	map = response.map;
	map.id = item.id;
	map.title = item.title;
	map.owner = item.owner;
	map.snippet = item.snippet;
	webmaps[currentMap] = map;
	
	updateDetails(map);
	esri.hide(dojo.byId('loadingImg'));
    }, function (error) {
	if (map) {
	    map.destroy();
	    dojo.destroy(map.container);
	    getNext();
	}
    });
}

function createThumbs(items) {
    var frag = document.createDocumentFragment();
    dojo.forEach(items, function (item, index) {
	if (item.id) {
	    var thumbnail = item.thumbnailUrl || 'https://static.arcgis.com/images/desktopapp.png'; //use default image if one is not provided
	    var li = dojo.create('li', {
		innerHTML: '<img src="' + thumbnail + '"/><p class="ellipsis">' + item.title + '</p>'
		
	    }, frag);
	    dojo.addClass(li, 'grid_2 gallery_grid');
	}
	dojo.connect(li, 'onclick', function () {
	    //close the thumbnail panel 
            hideMap();
            esri.hide(dojo.byId('thumbnailContainer'));
            currentMap = index;
            showMap();
	});
    });
    dojo.place(frag, 'thumbnailList');
}

function showMap() {
    //animate the display of the next map to fade-in 
    //increment the map count div
    var myMap = webmaps[currentMap];
    if (myMap && myMap.id) {
        var node = dojo.byId(myMap.id);
        esri.show(node);
        updateDetails(myMap);
        var anim = dojo.fadeIn({
	    node: node
	});
        anim.play();
    } else {
        //create the map 
        esri.show(dojo.byId('loadingImg'));
        createMap(items[currentMap])
    }
}

function updateDetails(item) {
    dojo.byId('mapTitle')
	.innerHTML = item.title;
    dojo.byId('mapOwner')
	.innerHTML = item.snippet;
    dojo.byId('mapCount')
	.innerHTML = dojo.string.substitute(
            "Map ${page} of  ${total}", {
		page: (currentMap + 1),
		total: items.length
	    });
}

function hideMap() {
    //Fade out the previous map 
    var node = dojo.byId(webmaps[currentMap].id);
    esri.hide(node);
    dojo.byId('mapTitle').innerHTML = '';
    dojo.byId('mapOwner').innerHTML = '';
    dojo.byId('mapCount').innerHTML = '';
    
    var anim = dojo.fadeOut({
	node: node
    });
    anim.play();
}

function getNext() {
    //hide the existing map 
    hideMap();
    (currentMap >= -1 && currentMap < (items.length - 1)) ? currentMap += 1 : currentMap = 0;
    showMap();
}

function getPrevious() {
    hideMap();
    (currentMap <= items.length && currentMap > 0) ? currentMap -= 1 : currentMap = items.length - 1;
    showMap();
}

function toggleGallery() {
    var tc = dojo.byId('thumbnailContainer');
    tc.style.display === 'none' ? esri.show(tc) : esri.hide(tc);
}

dojo.ready(init);
