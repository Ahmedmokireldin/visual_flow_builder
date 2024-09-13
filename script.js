document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('canvas');
    const toolboxItems = document.querySelectorAll('.toolbox-item');
    const nodeNameInput = document.getElementById('node-name');
    const nodeSpecificProperties = document.getElementById('node-specific-properties');
    const saveBtn = document.getElementById('save-btn');
    let nodes = [];
    let selectedNode = null;

    // Initialize jsPlumb
    const jsPlumbInstance = jsPlumb.getInstance({
        Connector: ["Bezier", { curviness: 50 }],
        Anchors: ["Top", "Bottom"]
    });

    toolboxItems.forEach(item => {
        item.addEventListener('dragstart', dragStart);
    });

    canvas.addEventListener('dragover', dragOver);
    canvas.addEventListener('drop', drop);
    nodeNameInput.addEventListener('input', updateNodeName);
    saveBtn.addEventListener('click', saveFlow);

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function drop(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('text');
        createNode(type, e.clientX, e.clientY);
    }

    function createNode(type, x, y) {
        const node = document.createElement('div');
        node.className = `node node-${type}`;
        node.innerHTML = `<i class="${getIconClass(type)}"></i><span>${type}</span>`;
        node.style.left = `${x - canvas.offsetLeft - 60}px`;
        node.style.top = `${y - canvas.offsetTop - 30}px`;
        node.dataset.type = type;
        canvas.appendChild(node);

        jsPlumbInstance.draggable(node, {
            containment: 'parent',
            stop: function(event) {
                updateNodePosition(node, event.pos[0], event.pos[1]);
            }
        });

        jsPlumbInstance.makeSource(node, {
            filter: ".connect-dot",
            anchor: "Continuous"
        });

        jsPlumbInstance.makeTarget(node, {
            anchor: "Continuous"
        });

        node.addEventListener('click', selectNode);

        const nodeData = {
            element: node,
            type: type,
            name: type,
            properties: getDefaultProperties(type)
        };

        nodes.push(nodeData);
        return nodeData;
    }

    function getIconClass(type) {
        const iconMap = {
            'start': 'fas fa-play',
            'facebook': 'fab fa-facebook',
            'twitter': 'fab fa-twitter',
            'instagram': 'fab fa-instagram',
            'landing-page': 'fas fa-file',
            'email': 'fas fa-envelope',
            'decision': 'fas fa-question',
            'catalogue': 'fas fa-book',
            'ai-personalization': 'fas fa-robot',
            'multi-path': 'fas fa-random',
            'end': 'fas fa-stop'
        };
        return iconMap[type] || 'fas fa-circle';
    }

    function getDefaultProperties(type) {
        switch(type) {
            case 'catalogue':
                return { products: [] };
            case 'ai-personalization':
                return { algorithm: 'default' };
            case 'multi-path':
                return { paths: [] };
            default:
                return {};
        }
    }

    function selectNode(e) {
        if (selectedNode) {
            selectedNode.element.style.boxShadow = 'none';
        }
        selectedNode = nodes.find(n => n.element === e.currentTarget);
        selectedNode.element.style.boxShadow = '0 0 0 2px blue';
        nodeNameInput.value = selectedNode.name;
        showNodeProperties(selectedNode);
    }

    function showNodeProperties(node) {
        nodeSpecificProperties.innerHTML = '';
        switch(node.type) {
            case 'catalogue':
                nodeSpecificProperties.innerHTML = `
                    <h4>Products</h4>
                    <ul id="product-list"></ul>
                    <input type="text" id="new-product" placeholder="Add product">
                    <button onclick="addProduct()">Add</button>
                `;
                updateProductList(node.properties.products);
                break;
            case 'ai-personalization':
                nodeSpecificProperties.innerHTML = `
                    <h4>AI Algorithm</h4>
                    <select id="ai-algorithm">
                        <option value="default">Default</option>
                        <option value="collaborative">Collaborative Filtering</option>
                        <option value="content">Content-Based</option>
                    </select>
                `;
                document.getElementById('ai-algorithm').value = node.properties.algorithm;
                document.getElementById('ai-algorithm').addEventListener('change', updateAIAlgorithm);
                break;
            case 'multi-path':
                nodeSpecificProperties.innerHTML = `
                    <h4>Paths</h4>
                    <ul id="path-list"></ul>
                    <input type="text" id="new-path" placeholder="Add path">
                    <button onclick="addPath()">Add</button>
                `;
                updatePathList(node.properties.paths);
                break;
        }
    }

    function updateNodeName() {
        if (selectedNode) {
            selectedNode.name = nodeNameInput.value;
            selectedNode.element.querySelector('span').textContent = selectedNode.name;
        }
    }

    function updateNodePosition(node, x, y) {
        const nodeData = nodes.find(n => n.element === node);
        nodeData.x = x;
        nodeData.y = y;
    }

    function saveFlow() {
        const flow = nodes.map(node => ({
            type: node.type,
            name: node.name,
            x: parseInt(node.element.style.left, 10),
            y: parseInt(node.element.style.top, 10),
            properties: node.properties
        }));

        const connections = jsPlumbInstance.getConnections().map(conn => ({
            source: nodes.findIndex(n => n.element.id === conn.source.id),
            target: nodes.findIndex(n => n.element.id === conn.target.id)
        }));

        const flowData = { nodes: flow, connections: connections };
        console.log(JSON.stringify(flowData, null, 2));
        alert('Flow saved to console');
    }

    // Helper functions for node-specific properties
    window.addProduct = function() {
        const newProduct = document.getElementById('new-product').value;
        if (newProduct && selectedNode) {
            selectedNode.properties.products.push(newProduct);
            updateProductList(selectedNode.properties.products);
            document.getElementById('new-product').value = '';
        }
    };

    function updateProductList(products) {
        const list = document.getElementById('product-list');
        list.innerHTML = products.map(p => `<li>${p}</li>`).join('');
    }

    function updateAIAlgorithm() {
        if (selectedNode) {
            selectedNode.properties.algorithm = document.getElementById('ai-algorithm').value;
        }
    }

    window.addPath = function() {
        const newPath = document.getElementById('new-path').value;
        if (newPath && selectedNode) {
            selectedNode.properties.paths.push(newPath);
            updatePathList(selectedNode.properties.paths);
            document.getElementById('new-path').value = '';
        }
    };

    function updatePathList(paths) {
        const list = document.getElementById('path-list');
        list.innerHTML = paths.map(p => `<li>${p}</li>`).join('');
    }
});