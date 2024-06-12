# @bartbutenaers/node-red-pattern-state-extractor
A Node-RED node to extract states from a numeric pattern

## Installation

Since this node is in an experimental phase, it is ***not*** available on NPM yet.  So not available in the palette!

Run the following npm command in your Node-RED user directory (typically ~/.node-red), to install this node directly from this Github repo:
```
npm install bartbutenaers/node-red-pattern-state-extractor
```
Note that you need to have Git installed, in order to be able to execute this command.

## Support my Node-RED developments

Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Node usage
Let's use for example the energy consumption pattern of a washing machine, which contains typically the following states:

![image](https://github.com/bartbutenaers/node-red-pattern-state-extractor/assets/14224149/7d7f7f22-8120-4050-832f-77d0e750c872)

Sometimes it is useful to determine those states and handle them in Node-RED.  Below is explained step by step how to accomplish that:

1. 
