# @bartbutenaers/node-red-pattern-state-mapping
A Node-RED node to map numeric patterns to states.

## Installation

Since this node is in an experimental phase, it is ***not*** available on NPM yet.  So not available in the palette!

Run the following npm command in your Node-RED user directory (typically ~/.node-red), to install this node directly from this Github repo:
```
npm install bartbutenaers/node-red-pattern-state-mapping
```
Note that you need to have Git installed, in order to be able to execute this command.

## Support my Node-RED developments

Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Node usage
Let's use for example the energy consumption pattern of a washing machine, which contains typically the following states:

![image](https://github.com/bartbutenaers/node-red-pattern-state-extractor/assets/14224149/7d7f7f22-8120-4050-832f-77d0e750c872)

Sometimes it is useful to determine those states and handle them in Node-RED.  Below is explained step by step how to accomplish that:

1. Determine the magnitude of values in the various states.  This can e.g. be done by showing the values in a chart in the Node-RED dashboard:

   ![chart_values](https://github.com/bartbutenaers/node-red-pattern-state-extractor/assets/14224149/287d7a7c-3b02-4059-b6ba-edd8cb3b0909)

2. The payload of the input messages can be:
   + An array of samples: the node will automatically reset and try to find the states.  This can be used e.g. when historical samples are loaded from a timeseries database.
   + A single sample: the node will append this sample to the previously injected samples and combine them to try to find the next state.  This can be used e.g. when a new measurement arrives, in case of live measuring the power consumtpion of a device.

   Each of those samples needs to be an object, containing some property with a numerical value (that will be evaluated).  The name of that numerical property should be specified.  For example for samples of the format `{x: 2024-05-27T04:45:07.217Z, y: 2713}` the following setting is required:

   ![image](https://github.com/bartbutenaers/node-red-pattern-state-extractor/assets/14224149/6e842b75-d449-4798-8fdc-900d0b78b058)

3. Enter in this node which sequence of values indicate the start of a new state:

   ![image](https://github.com/bartbutenaers/node-red-pattern-state-extractor/assets/14224149/aed6d51d-60ee-4ea2-a5b5-610eb1aa33c6)

   Every sequence has the following properties:
   + *State*: the name of the new state that will start when this numeric sequence occurs.
   + *Previous state*: the name of the previous state.  The node will only look for this sequence as long as this previous state is active.
   + *Length*: the length of the sequence, i.e. how many numbers need to be checked.
   + *Count*: the minimum count of numbers in the sequence that should be in the specified min-max range.
   + *Min*: the minimum numerical value that is expected.  If left empty there will be no minimum.
   + *Max*: the maximum numerical value that is expected.  If left empty there will be no maximum.

   Let's explain the first rule in the above screenshot:  The state will become "FILL" if the previous state is "OFF", and minimum 2 of 3 successive values is above 50.

5. Inject a single message whose payload contains an array of samples, or inject a series of messages each containing a single sample in the payload.

6. When the rules have been setup correctly, an output message should be send (on the second output) as soon as a new state has been detected.

7. When an output field has been specified, the current state will be added to every sample (which is forwarded to the first output):

   ![image](https://github.com/bartbutenaers/node-red-pattern-state-extractor/assets/14224149/b94c7354-b8b8-4b1e-bec5-6091436e8580)

   The resulting sample will look like this:

TODO: windown hernoemen naar length & output field werkt niet & info panel toevoegen & dit aan wiki toevoegen
