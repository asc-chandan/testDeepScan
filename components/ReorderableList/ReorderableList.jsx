import React from 'react';

import PropTypes from 'prop-types';

function ReorderableList(props) {
    const { listId, listLength, onReorder } = props;

    const handleItemMouseDown = (e) => {
        e.stopPropagation();
        let mouseMoved = false; // to ignore click events(which also trigger moudedown )

        const initialIndex = Number(e.currentTarget.dataset['rlistDraggableIndex']);
        let lastComparedItemIndex = initialIndex; // start comparing with iteself initally
        let itemAboveWhichIndicatorToBeShownIndex;


        const sortableListElement = document.querySelector(`[data-rlist-id="${listId}"]`);
        const draggingItemElement = e.currentTarget;

        const draggingItemElementCord = draggingItemElement.getBoundingClientRect();
        const distBwItemLeftEdgeAndMouseX = e.pageX - draggingItemElementCord.left; // to retain the dragging start mouse position
        const distBwItemTopEdgeAndMouseY = e.pageY - draggingItemElementCord.top;


        // Construct a shallow clone(Just a DIV having dimensions and styles as same as original) of draggingItemElement which will move with mouse
        const draggingItemCopy = document.createElement('div');
        draggingItemCopy.id = `rlist-draggable-${draggingItemElement.dataset['rlistDraggableId']}-moving-copy`;
       
        // copy some major styles of dragging element to draggingElement movable copy
        const draggingItemStyles = window.getComputedStyle(draggingItemElement);
        const cssPropertiesToCopy = ['background-color', 'color', 'height', 'width','padding'];
        let draggingItemCopyStyles = '';
        cssPropertiesToCopy.forEach(cssProp => {
            draggingItemCopyStyles += `${cssProp}:${draggingItemStyles.getPropertyValue(cssProp)};`;
        });
        // add some styles to keep the text vertically centered
        draggingItemCopyStyles += 'display:flex;align-items:center;';
        draggingItemCopy.style.cssText = draggingItemCopyStyles;

        // insert the text in Div
        const draggingItemCopyText = e.currentTarget.dataset['itemDragCopyText'];
        draggingItemCopy.innerText = draggingItemCopyText;

        // construct the drag-indicator
        const dragIndicator = document.createElement('div');
        dragIndicator.style.width = draggingItemStyles.getPropertyValue('width');
        dragIndicator.style.height = '2px';
        dragIndicator.style.background = 'blue';
        dragIndicator.style.position = 'fixed';
        dragIndicator.style.left = draggingItemElementCord.left + 'px';
        dragIndicator.style.transform = `translate(0,${-Number(dragIndicator.style.height.replace('px', '')) / 2}px)`;
        dragIndicator.style.zIndex = 5000;


        // attach mousemove and mouseup event handlers
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        let copyAppendedToDOM = false; // to construct the draggingElementCopy only once
        let direction = '', prevY;
        function handleMouseMove(eInner) {
            mouseMoved = true;

            if (!copyAppendedToDOM) {
                document.body.appendChild(draggingItemCopy);
                document.body.appendChild(dragIndicator);
                copyAppendedToDOM = true;
            }

            // change the cursor
            document.body.style.cursor = 'grabbing';

            // change the UI of dragging Element
            draggingItemElement.style.opacity = '0.5';

            // change the UI of dragging Element copy and update its position according to mouse position
            draggingItemCopy.style.position = 'fixed';
            draggingItemCopy.style.top = eInner.pageY - distBwItemTopEdgeAndMouseY + 'px';
            draggingItemCopy.style.left = eInner.pageX - distBwItemLeftEdgeAndMouseX + 'px';
            // draggingItemCopy.style.border = '1px solid #333';
            draggingItemCopy.style.opacity = '0.8';
            draggingItemCopy.style.zIndex = 5001;

            // find the moving direction
            if (prevY < eInner.pageY) { direction = 'down'; }
            else if (prevY > eInner.pageY) { direction = 'up'; }
            prevY = eInner.pageY;


            let currentItemToCompareIndex;
            if (direction === 'up') {
                currentItemToCompareIndex = lastComparedItemIndex - 1;
                const currentItemToCompareElement = sortableListElement.querySelector(`[data-rlist-draggable-index="${currentItemToCompareIndex}"]`);
                if (currentItemToCompareElement) {
                    const currentItemToCompareCord = currentItemToCompareElement.getBoundingClientRect();
                    const draggingItemCopyMid = Number(draggingItemCopy.style.top.replace('px', '')) + Number(draggingItemCopy.style.height.replace('px', '')) / 2;
                    const currentItemToCompareMid = currentItemToCompareCord.top + currentItemToCompareCord.height / 2;
                    if (draggingItemCopyMid < currentItemToCompareMid) {
                        lastComparedItemIndex = currentItemToCompareIndex;
                    }
                }
                itemAboveWhichIndicatorToBeShownIndex = lastComparedItemIndex;
            } else {
                // when direction='down'
                currentItemToCompareIndex = lastComparedItemIndex + 1;
                const currentItemToCompareElement = sortableListElement.querySelector(`[data-rlist-draggable-index="${currentItemToCompareIndex}"]`);
                if (currentItemToCompareElement) {
                    const currentItemToCompareCord = currentItemToCompareElement.getBoundingClientRect();
                    const draggingItemCopyMid = Number(draggingItemCopy.style.top.replace('px', '')) + Number(draggingItemCopy.style.height.replace('px', '')) / 2;
                    const currentItemToCompareMid = currentItemToCompareCord.top + currentItemToCompareCord.height / 2;
                    if (draggingItemCopyMid > currentItemToCompareMid) {
                        lastComparedItemIndex = currentItemToCompareIndex;
                    }
                }
                itemAboveWhichIndicatorToBeShownIndex = currentItemToCompareIndex;
            }

            if (itemAboveWhichIndicatorToBeShownIndex < listLength) {
                const itemAboveWhichIndicatorToBeShownCord = sortableListElement.querySelector(`[data-rlist-draggable-index="${itemAboveWhichIndicatorToBeShownIndex}"]`).getBoundingClientRect();
                dragIndicator.style.top = Number(itemAboveWhichIndicatorToBeShownCord.top) + 'px';
            }

        }

        function handleMouseUp(eInner) {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            if (!mouseMoved) { return; }
            draggingItemElement.style.opacity = 1; // revert the opacity
             document.body.style.cursor = 'default';     // revert the cursor
            draggingItemCopy.remove();
            dragIndicator.remove();


            // console.log('local', currentDropIndex);
            const initIndex = initialIndex;
            const finalIndex = initialIndex >= itemAboveWhichIndicatorToBeShownIndex ? itemAboveWhichIndicatorToBeShownIndex : itemAboveWhichIndicatorToBeShownIndex - 1;
            // console.log('initialdrop', initIndex);
            // console.log('finaldrop', finalIndex);
            if (initIndex !== finalIndex) {
                onReorder(initIndex, finalIndex);
            }

        }

    };

    const listProps = {
        'data-rlist-id': props.listId,
    };
    const listItemProps = {
        onMouseDown: handleItemMouseDown
    };

    return (
        <>
            {props.children(listProps, listItemProps)}
        </>
    );

}


function ReorderableListItem({ draggableId, index, shadowItemTextOnDrag, ...props }) {
    const itemProps = {
        'data-rlist-draggable-id': `${draggableId}`,
        'data-rlist-draggable-index': index,
        'data-item-drag-copy-text': shadowItemTextOnDrag,
        'draggable': false,
        'style': {
            'boxSizing': 'border-box',
            'userSelect': 'none',
            'cursor': 'grab'
        }

    };

    return (
        props.children(itemProps)
    );
}

ReorderableList.propTypes = {
    listId: PropTypes.string.isRequired,
    onReorder: PropTypes.func.isRequired,
    children: PropTypes.func.isRequired
};

ReorderableListItem.propTypes = {
    draggableId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    shadowItemTextOnDrag : PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    children: PropTypes.func.isRequired
};


export { ReorderableList, ReorderableListItem };