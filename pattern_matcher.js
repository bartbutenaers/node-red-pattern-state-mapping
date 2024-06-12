module.exports = function(RED) {
    function PatternMatcherNode(config) {
        RED.nodes.createNode(this, config)
        let node = this

        function resetMovingWindows() {
            config.transitions.forEach((transition) => {
                transition.movingWindow = []
            })
        }

        // TODO: Specify the default state in the config screen
        node.currentState = 'OFF'
        node.history = []
        resetMovingWindows()

        node.status({fill: 'blue', shape: 'dot', text: node.currentState})

        function addSample(sample) {
            config.transitions.forEach((transition) => {
                // Only consider transitions which are possible starting from the current state
                if (transition.previousState !== node.currentState) {
                    return
                }

                if (typeof sample !== 'object' || !sample.hasOwnProperty(config.inputField) || typeof sample[config.inputField] !== 'number') {
                    throw new Error(`Every sample should be an object with a numeric property "${config.inputField}"`)
                }

                let value = sample[config.inputField]

                // Check if the value is within the specified range
                let inRange = false
                if (transition.minimumValue !== '' && transition.maximumValue !== '') {
                    inRange = value >= transition.minimumValue && value <= transition.maximumValue
                } else if (transition.minimumValue !== '') {
                    inRange = value >= transition.minimumValue
                } else if (transition.maximumValue !== '') {
                    inRange = value <= transition.maximumValue
                }

                // Remove the oldest inRange boolean from the start of the moving window, when the window is full
                if (transition.movingWindow.length == transition.windowLength) {
                    transition.movingWindow.shift()
                }

                // Add the new inRange boolean value at the end of the moving window
                transition.movingWindow.push({ inRange: inRange, sample: sample })

                // Count the number of trues in the moving window, i.e. the number of in-range values
                let trueCount = transition.movingWindow.filter((val) => val.inRange).length

                // When the minimum count of in-range values is reached, the new state can be activated
                if (trueCount >= transition.minimumCount) {
                    const oldState = node.currentState
                    node.currentState = transition.state
                    node.status({fill: 'blue', shape: 'dot', text: node.currentState})

                    // Get all the elements from movingWindow starting from the first one that has inRange = true
                    let samplesNewState = transition.movingWindow.filter((val) => val.inRange)

                    let outputMsg = {
                        payload: {
                            sample: samplesNewState[0].sample, // First sample in the samplesNewState
                            oldState: oldState,
                            newState: node.currentState,
                        }
                    }

                    node.send([null, outputMsg])

                    // Start all over again to determine the transition to the next state
                    resetMovingWindows()

                    // Store the content of samplesNewState in transition.MovingWindow
                    transition.movingWindow = samplesNewState
                }
            })
        }

        node.on('input', function(msg) {
            try {
                if (Array.isArray(msg.payload)) {
                    // TODO: Specify the default state in the config screen
                    node.history = []
                    node.currentState = 'OFF'
                    node.status({fill: 'blue', shape: 'dot', text: node.currentState})

                    resetMovingWindows()

                    let samples = msg.payload
                    samples.forEach((sample) => {
                        addSample(sample)
                    })

                    if (config.outputField !== 'none') {
                        // When the input is an array of samples, the output should also contain the array of states
                        RED.util.setMessageProperty(msg, config.outputField, node.history, true)
                    }
                } else {
                    let sample = msg.payload
                    addSample(sample)

                    if (config.outputField !== 'none') {
                        // When the input is a single sample, the output should contain the current state
                        RED.util.setMessageProperty(msg, config.outputField, node.currentState, true)
                    }
                }

                node.send([msg, null])
            } catch(err) {
                node.error(err)
            }
        })

        node.on('close', function() {
            node.status({})
        })
    }
    RED.nodes.registerType('pattern-matcher', PatternMatcherNode)
}
