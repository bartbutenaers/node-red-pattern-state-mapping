module.exports = function(RED) {
    function PatternStateMappingNode(config) {
        RED.nodes.createNode(this, config)
        let node = this

        // TODO: Specify the default state in the config screen
        node.defaultState = 'OFF'

        node.currentState = node.defaultState
        node.movingWindow = []
        node.validConfig = true

        const states = new Set(config.transitions.map((t) => t.state))
        const previousStates = new Set(config.transitions.map((t) => t.previousState))

        // All the transition previous states should refer to a valid state.
        // The previous state is optional in the config screen: '' means that any state can be the previous state
        config.transitions.forEach((transition) => {
            if (transition.previousState !== '' && !states.has(transition.previousState)) {
                console.error(`Previous state "${transition.previousState}" is referring to a non-existing state.`)
                node.validConfig = false
            }
        })

        // For every state there should be at least 1 transition, that has that state as previous state
        config.transitions.forEach((transition) => {
            if (!previousStates.has(transition.state) && !previousStates.has('')) {
                console.error(`There is no previous state referring to state for ${transition.state}`)
            }
        })

        // Determine the size of the largest window for any of the available transitions.
        node.maxWindowLength = Number.NEGATIVE_INFINITY;
        config.transitions.forEach((transition) => {
            if (transition.windowLength > node.maxWindowLength) {
                node.maxWindowLength = transition.windowLength;
            }
        })

        // Make sure that all transitions have a minimum and maximum value.
         // Because both fields are optional in the config screen, so '' means infinit.
        config.transitions.forEach((transition) => {
            if (transition.minimumValue === '') {
                transition.minimumValue = Number.NEGATIVE_INFINITY
            }

            if (transition.maximumValue === '') {
                transition.maximumValue = Number.POSITIVE_INFINITY
            }
        })

        node.status({fill: 'blue', shape: 'dot', text: node.currentState})

        function removeMovingWindowTail(sendWhenStateReady) {
            let removedSample = node.movingWindow.shift()

            // When no state has been determined yet for this sample, then apply the current state to it
            if (!removedSample.state) {
                removedSample.state =  node.currentState || node.defaultState
            }

            // Add the state to the sample object, when required
            if (config.outputField !== 'none') {
                RED.util.setMessageProperty(removedSample.sample, config.outputField, removedSample.state, true)
            }

            // Send the sample as a separate output message, when required
            if (sendWhenStateReady) {
                let newMsg = {payload: removedSample.sample}
                node.send([newMsg, null])
            }
        }

        function addSample(sample, sendWhenStateReady) {
            if (typeof sample !== 'object' || !sample.hasOwnProperty(config.inputField) || typeof sample[config.inputField] !== 'number') {
                throw new Error(`Every sample should be an object with a numeric property "${config.inputField}"`)
            }

            // Move the window one sample further, by adding the new sample to the window
            node.movingWindow.push({ sample: sample, state: null })

            // Remove the oldest sample from the moving window, when the window is full.
            // The lenght of the moving window is the maximum length of all the windows from all the specified transitions.
            if (node.movingWindow.length == node.maxWindowLength) {
                removeMovingWindowTail(sendWhenStateReady)
            }

            // Get all transitions that are allowed starting from the current state
            let allowedTransitions = config.transitions.filter((t) => t.previousState === node.currentState)

            for (let i = 0; i < allowedTransitions.length; i++) {
                let transition = allowedTransitions[i]

                // Check how many sample values from the moving window are within the specified range of this transition.
                // Only take into account the N most recent samples from the moving window (with N = window length of the transition).
                let startIndex = Math.max(0, node.movingWindow.length - transition.windowLength)
                let inRangeCount = 0
                for (let i = startIndex; i < node.movingWindow.length; i++) {
                    let movingWindowElement = node.movingWindow[i]

                    // Ignore samples that belong to the previous state (i.e. which have been assigned a state already)
                    if (!movingWindowElement.state) {
                        // Get the numerical value from the sample
                        let value = movingWindowElement.sample[config.inputField]

                        if (value >= transition.minimumValue && value <= transition.maximumValue) {
                            inRangeCount++
                        }
                    }
                }

                if (inRangeCount >= transition.minimumCount) {
                    // When the minimum count of in-range values is reached, a new state has been detected
                    const oldState = node.currentState
                    node.currentState = transition.state
                    node.status({fill: 'blue', shape: 'dot', text: node.currentState})

                    // Find the first sample in the moving window which is in range (and does not belong to a previous state).
                    // That sample will be the start of the new state.
                    // All previous samples (without state) should be assigned to the previous state.
                    for (let j = 0; j < node.movingWindow.length; j++) {
                        let movingWindowElement = node.movingWindow[j]

                        if (movingWindowElement.state) {
                            continue
                        }

                        // Get the numerical value from the sample
                        let value = movingWindowElement.sample[config.inputField]

                        if (value >= transition.minimumValue && value <= transition.maximumValue) {
                            // The first sample with a value in range (for this transition), will be the start of the new state.
                            // Let's send an output msg on the second port to report the new state.
                            let outputMsg = {
                                payload: movingWindowElement.sample,
                                oldState: oldState,
                                newState: node.currentState,
                            }
                            node.send([null, outputMsg])

                            // Leave all next samples in the moving window untouched, because they might be part of again a next state
                            return
                        }
                        else {
                            // All the samples in the moving window BEFORE the new state start sample, belong to the previous state
                            movingWindowElement.state = oldState
                        }
                    }
                }
            }
        }

        node.on('input', function(msg) {
            try {
                if (Array.isArray(msg.payload)) {
                    // TODO: Specify the default state in the config screen
                    node.currentState = 'OFF'
                    node.movingWindow = []
                    node.status({fill: 'blue', shape: 'dot', text: node.currentState})

                    let samples = msg.payload
                    samples.forEach((sample) => {
                        addSample(sample, false)
                    })

                    // At the end, the moving window is still filled with samples, which belong to the current state.
                    // So they need to be processed similar to all other previous samples.
                    while (node.movingWindow.length > 0) {
                        removeMovingWindowTail(false)
                    }

                    node.send([msg, null])
                } else {
                    let sample = msg.payload
                    addSample(sample, true)
                }
            } catch(err) {
                node.error(err)
            }
        })

        node.on('close', function() {
            node.status({})
        })
    }
    RED.nodes.registerType('pattern-state-mapping', PatternStateMappingNode)
}
