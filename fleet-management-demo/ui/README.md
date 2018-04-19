# dashboard

## Setting up (assuming current directory is "visualization")
1. Install dependencies:

```
sudo apt-get -qqy install nodejs npm
sudo npm install -g bower
sudo npm install -g gulp
sudo npm install -g forever
sudo npm install
sudo bower install --allow-root
sudo ln -s `which nodejs` /usr/bin/node (for linux only)
sudo ln -s `which gulp` ./gulp
cd node_modules/ui-leaflet && sudo npm install --production && cd ..
```

2. Set configuration in `config.json` (see <a href="#configuration">configuration</a> section below)

3. Set listening port for preview server (otherwise default is 5555)

```
export IGZ_PREVIEW_LISTEN_PORT=<port_number>
```

4. Build and run preview server

```
forever start gulp
```

5. Open web browser and navigate to http://host|ip:port and see that it's working

6. stop preview server

```
forever stopall
```

## Configuration
The app works with built in default hard-coded configuration.  
That configuration can be overridden by the use of an external configuration file.  

The file should be named `config.json` and should be located in the root of `visualization` directory.

Not all properties have to be present in `config.json`, you can add only the properties you wish to override.

The changes take effect while running `gulp`.

Example for a full `config.json` file:
```json
{
  "url": "http://10.90.1.41:8081/1/vin/data",
  "trucksCount": 400,
  "refreshDelay": 20000,
  "weather": {
    "sunny": "clear",
    "rainy": "rain",
    "cloudy": "clouds",
    "snowy": "snowy",
    "stormy": "stormy"
  },
  "heatmap": {
    "radius": 20,
    "blur": 10
  }
}
```

## Using livereload (for developing)
livereload is a tool used by web developers for on-the-fly development and testing.

While running `$gulp watch`, it allows you to automatically reload the page on which you're
currently working.

In order to use it, you will first need to install the [livereload chrome extension](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei).

After activating the extension, run gulp watch - it now spawns a livereload server, which signals your page
to reload every time you make a change in one of your files.

Finally, activate the chrome extension in your tab by clicking on the new livereload icon that showed up
in your taskbar, making the hollow circle in the middle of it opaque.