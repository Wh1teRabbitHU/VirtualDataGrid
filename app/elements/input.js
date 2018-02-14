'use strict';

function createInputNode(cellData, eventInstances) {
	var inputNode = document.createElement('input');

	inputNode.value = cellData.getValue();
	inputNode.style.minWidth = '10px'; // TODO: Kiszervezni osztályba
	inputNode.style.width = '80%'; // TODO: Kiszervezni osztályba
	inputNode.setAttribute('type', cellData.dataType);
	inputNode.addEventListener('blur', eventInstances.onInputBlurEventHandler);
	inputNode.addEventListener('keyup', eventInstances.onInputKeyUpEventHandler);

	return inputNode;
}

module.exports = {
	createInputNode: createInputNode
};