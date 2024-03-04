
window.onload = () => {
    Init();
}

// Constants

const MIN_MAGUNITUDE = 1.0;
const MIN_MAGUNITUDE_RADIUS = 2000;
const LATE_RADIUS_RATIO = 2

// end Constants

// Variables

let globalMap = void 0;

// end Variables

function Init() {
    const Map = L.map('app', {
        center: [37.9161, 139.0364],
        zoom: 7,
        minZoom: 5.5,
        maxZoom: 9,
        preferCanvas: true
    })
    Promise.all([
        fetch("../geojson/Cities.json").then(r => r.ok ? r.json() : null).then(geojson => {
            const japanCitysGeo = L.geoJSON(geojson, {
                style: function (geojson) {
                    return {
                        weight: 0.3,
                        color: "#999999",
                        fillColor: "#081a1a"
                    }
                }
            }).addTo(Map)
        }),
        fetch("../geojson/japan.json").then(r => r.ok ? r.json() : null).then(geojson => {
            const japanCitysGeo = L.geoJSON(geojson, {
                style: function (geojson) {
                    return {
                        weight: 1,
                        color: "#999999",
                        fillColor: "#081a1a"
                    }
                }
            }).addTo(Map)
        })
    ])

    globalMap = Map;

    
    const elem = document.getElementsByClassName('leaflet-right')
    if (0 < elem.length) {
        [...elem].forEach(v => { return v.remove() })
    }
    //
    const button = document.getElementsByClassName('leaflet-control-zoom')
    if (0 < button.length) {
        [...button].forEach(v => { return v.remove() })
    }

   displayEarthquakeDatas();
}

function MathDepthToColorPath( depth ){
    const THE_HIGHEST_COLOR_NUMBER = 255;
    const DEEPEST_DEPTH = 700;

    if( depth > DEEPEST_DEPTH ) return { r : 0 , b : 255 };
    if( depth * 7 > DEEPEST_DEPTH ) return { r : 0 , b : 255 };

    const RedColor = Math.floor( THE_HIGHEST_COLOR_NUMBER - ( THE_HIGHEST_COLOR_NUMBER * ( ( depth * 7 ) / DEEPEST_DEPTH ) ));
    return {
        r : RedColor,
        b : THE_HIGHEST_COLOR_NUMBER - RedColor
    }
}

async function displayEarthquakeDatas(){
    const earthquakeDatas = await getEarthquakeDataFromP2P();
    
    earthquakeDatas.map(( einfo , index , _ ) => {
        
        const color = MathDepthToColorPath( einfo.depth );
        const radius = einfo.magnitude > MIN_MAGUNITUDE ? MIN_MAGUNITUDE_RADIUS * ( einfo.magnitude * einfo.magnitude * LATE_RADIUS_RATIO ) : MIN_MAGUNITUDE_RADIUS;
        const randomColor = "#" + parseInt( color.r ).toString(16) + "00" + parseInt( color.b ).toString(16);
        const wakuwakusan = "#" + parseInt( color.r + 20 > 255 ? color.r : color.r + 20 ).toString(16) + "00" + parseInt( color.b + 20 > 255 ? color.b : color.b + 20 ).toString(16);

        console.log(`M ${einfo.magnitude} : Mathed radius ${radius} : Depth ${ einfo.depth }km , Mathed ${ color.r } ${ color.b }`)

        L.circle([einfo.latitude, einfo.longitude], {
            color: wakuwakusan,
            fillColor: randomColor,
            fillOpacity: 0.5,
            radius: radius
        }).addTo(globalMap);

        if( index === _.length - 1 ){
            document.getElementById('count').innerText = index;
            document.getElementById('title').innerText = `過去${index}件の地震規模可視化`
        }
        /*
        L.marker([einfo.latitude, einfo.longitude], {
            icon: L.icon({
                iconUrl: "./assets/a.png",
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            })
        }).addTo(globalMap) 
        */

    })
}

async function getEarthquakeDataFromP2P(){
    const response = await fetch("https://api.p2pquake.net/v2/history?codes=551&limit=100");
    const data = await response.json();

    /** @type {{ magnitude : number; depth : number; latitude: number, longitude : number}[]} */
    const earthquakeInfomations = [];

    data.map( ( einfo ) => {
        if( einfo.issue.type !== "DetailScale" ) return;
        earthquakeInfomations.push({
            "magnitude" : einfo.earthquake.hypocenter.magnitude,
            "depth" : einfo.earthquake.hypocenter.depth,
            "latitude" : einfo.earthquake.hypocenter.latitude,
            "longitude" : einfo.earthquake.hypocenter.longitude,
        })
    })

    return earthquakeInfomations;
}