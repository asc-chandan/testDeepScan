import React, { useContext, useEffect, useRef, useState } from 'react';

import PropTypes from 'prop-types';


const DndDataContext = React.createContext();

function DndContext({ onDragEnd, ...props }) {

    const [contextId] = useState(DndContext.DndContextCounter);
    const droppableDisableFns = useRef({});

    useEffect(() => {
        DndContext.DndContextCounter++;
    }, []);


    const handleDraggableMouseDown = (e) => {
        e.stopPropagation();
        // only handle the mouse left click( which has e.button=0)
        if (e.button !== 0) { return }
        let mouseMoved = false; // to ignore click events(which also trigger moudedown )

        const draggingItemElement = e.currentTarget;

        const draggingItemElementCord = draggingItemElement.getBoundingClientRect();
        const distBwItemLeftEdgeAndMouseX = e.pageX - draggingItemElementCord.left; // to retain the dragging start mouse position
        const distBwItemTopEdgeAndMouseY = e.pageY - draggingItemElementCord.top;


        // CLONE CONSTUCTION
        // Construct a shallow clone(Just a DIV having dimensions and styles as same as original) of draggingItemElement which will move with mouse
        const draggingItemCopy = document.createElement('div');
        draggingItemCopy.id = `dnd-draggable-${draggingItemElement.dataset['dndDraggableId']}-moving-copy`;

        // copy some major styles of dragging element to draggingElement movable copy
        const draggingItemStyles = window.getComputedStyle(draggingItemElement);
        const cssPropertiesToCopy = ['background-color', 'color', 'height', 'width', 'padding'];
        let draggingItemCopyStyles = '';
        cssPropertiesToCopy.forEach(cssProp => {
            draggingItemCopyStyles += `${cssProp}:${draggingItemStyles.getPropertyValue(cssProp)};`;
        });

        // add some styles to keep the text vertically centered
        draggingItemCopyStyles += 'display:flex;align-items:center;';

        // check if user has also passed some styles for clone, if available, then give priority to these styles
        // Note - Ignore the styles related to positioning and dimensions(e.g. top,left,bottom,right,height,width), User can't alter these styles
        const draggingItemCopyStylesPassedByUser = JSON.parse(draggingItemElement.dataset['dndDraggableCloneStyles']);
        const stylesToIgnore = ['top', 'left', 'right', 'bottom', 'height', 'width', 'transform'];
        for (let style in draggingItemCopyStylesPassedByUser) {
            if (Object.prototype.hasOwnProperty.call(draggingItemCopyStylesPassedByUser, style) && !stylesToIgnore.includes(style)) {
                draggingItemCopyStyles += `${style}:${draggingItemCopyStylesPassedByUser[style]};`;
            }
        }

        draggingItemCopy.style.cssText = draggingItemCopyStyles;

        // insert the text in Div
        const draggingItemCopyText = e.currentTarget.dataset['dndDraggableCloneText'];
        draggingItemCopy.innerText = draggingItemCopyText;


        // DROPPABLE CORDINATES CALCULATION
        // store refs for all droppables within this context
        const droppableRefs = document.querySelectorAll(`[data-dnd-context-id="${contextId}"][data-dnd-droppable-id]`);
        let droppableRefsCords = [];
        droppableRefs.forEach(ref => {
            const { top, left, right, bottom, width, height } = ref.getBoundingClientRect();
            droppableRefsCords.push({ ref, top, right, bottom, left, width, height });
        });


        // attach mousemove and mouseup event handlers
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        let copyAppendedToDOM = false; // to construct the draggingElementCopy only once
        let overlappingDroppable = null;

        function handleMouseMove(eInner) {
            mouseMoved = true;

            if (!copyAppendedToDOM) {
                document.body.appendChild(draggingItemCopy);
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
            draggingItemCopy.style.zIndex = 999999;

            // CHECK OVERLAPPING WITH DROPPABLE ELEMENTS
            const draggingItemCords = ['height', 'width', 'top', 'left'].reduce((obj, x) => ({ ...obj, [x]: Number(draggingItemCopy.style[x].replace('px', '')) }), {});

            // rever the draggingOver style on each droppable( it will remove any previously added class)
            droppableRefsCords.forEach(refCord => revertDraggingOverStyles(refCord.ref, refCord.ref.dataset['dndDraggingOverClass']));

            overlappingDroppable = droppableRefsCords.find(refCord => isElementInsideDroppableArea(draggingItemCords, refCord))
            if (overlappingDroppable) {
                // check further if dropping is disabled for this droppable or not
                const droppableId = overlappingDroppable.ref.dataset['dndDroppableId'];
                // if dropDisableFunction is available, enable the drop,
                // else call that function by passing the draggableId, this function should return true/false
                const isDropDisabled = !!droppableDisableFns.current[droppableId]===true ? !droppableDisableFns.current[droppableId](draggingItemElement.dataset['dndDraggableId']) : false;
                if (isDropDisabled) {
                    overlappingDroppable = null;
                    document.body.style.cursor = 'not-allowed';
                } else {
                    // dropping is allowed, do needed UI udpates
                    applyDraggingOverStyles(overlappingDroppable.ref, overlappingDroppable.ref.dataset['dndDraggingOverClass']);
                    document.body.style.cursor = 'grabbing';
                }
            } else {
                overlappingDroppable = null;
            }
        }

        function handleMouseUp() {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            if (!mouseMoved) { return; }
            draggingItemElement.style.opacity = 1; // revert the opacity
            document.body.style.cursor = 'default';     // revert the cursor
            draggingItemCopy.remove();

            // check if there it was dropped on some droppable or not
            if (overlappingDroppable) {
                const droppableId = overlappingDroppable.ref.dataset['dndDroppableId'];
                revertDraggingOverStyles(overlappingDroppable.ref, overlappingDroppable.ref.dataset['dndDraggingOverClass']);
                // trigger the dragEnd event available props by passing the ids of dragged and dropped elements
                onDragEnd({
                    draggableId: draggingItemElement.dataset['dndDraggableId'],
                    droppableId: droppableId
                });
            } else {
                // still trigger the dragEnd event with droppableId=null so that if user wants to do something(e.g show some alert), he/she can do that
                onDragEnd({
                    draggableId: draggingItemElement.dataset['dndDraggableId'],
                    droppableId: null
                });
            }
        }

        function isElementInsideDroppableArea(draggingElementCords, droppableElementCords) {

            if (
                (draggingElementCords.left + draggingElementCords.width / 2) > droppableElementCords.left
                && (draggingElementCords.left + draggingElementCords.width / 2) < droppableElementCords.right
                && (draggingElementCords.top + draggingElementCords.height / 2) > droppableElementCords.top
                && (draggingElementCords.top + draggingElementCords.height / 2) < droppableElementCords.bottom
            ) {
                return true;
            }
            return false;
        }

        function applyDraggingOverStyles(droppableElement, draggingOverClass) {
            draggingOverClass !== '' && droppableElement.classList.add(draggingOverClass);
        }

        function revertDraggingOverStyles(droppableElement, draggingOverClass) {
            draggingOverClass !== '' && droppableElement.classList.remove(draggingOverClass);
        }

    };



    return (
        <>
            <DndDataContext.Provider
                value={{
                    contextId: contextId,
                    draggableMouseDownHandler: handleDraggableMouseDown,
                    droppableDisableFns: droppableDisableFns.current,
                }}>
                {props.children}
            </DndDataContext.Provider>
        </>
    );

}

DndContext.DndContextCounter = 0;

function DndDroppable({ droppableId, isDroppable, draggingOverClassName = '', ...props }) {

    const { contextId, droppableDisableFns } = useContext(DndDataContext);
    useEffect(() => {
        droppableDisableFns[droppableId] = isDroppable;
    }, []);


    const droppableProps = {
        'data-dnd-context-id': contextId,
        'data-dnd-droppable-id': droppableId,
        'data-dnd-dragging-over-class': draggingOverClassName,
    };

    return (
        <>
            {props.children(droppableProps)}
        </>
    );

}

function DndDraggable({ draggableId, dragCloneText, dragCloneStyles = {}, ...props }) {

    const { draggableMouseDownHandler, contextId } = useContext(DndDataContext);

    const draggableProps = {
        'data-dnd-context-id': contextId,
        'data-dnd-draggable-id': draggableId,
        'data-dnd-draggable-clone-text': dragCloneText,
        'data-dnd-draggable-clone-styles': JSON.stringify(dragCloneStyles),
        'draggable': false,
        'style': {
            'userSelect': 'none',
            'cursor': 'grab'
        },
        onMouseDown: draggableMouseDownHandler,
    };

    return (
        <>
            {props.children(draggableProps)}
        </>
    );

}


DndContext.propTypes = {
    onDragEnd: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

DndDroppable.propTypes = {
    droppableId: PropTypes.string.isRequired,
    isDroppable: PropTypes.func,
    draggingOverClassName: PropTypes.string,
    children: PropTypes.func.isRequired
};

DndDraggable.propTypes = {
    draggableId: PropTypes.string.isRequired,
    dragCloneText: PropTypes.string.isRequired,
    dragCloneStyles: PropTypes.object,
    children: PropTypes.func.isRequired
};


export { DndContext, DndDroppable, DndDraggable };
