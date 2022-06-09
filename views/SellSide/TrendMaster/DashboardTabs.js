import React, { useRef, useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import alertService from '../../../services/alertService';
import '../../../styles/DashboardTabs.scss';

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

export default function DashboardTabs({ tabs, activeTabId, onOpen, onEdit, onPublish, onRemove, onPanelToggle, onTabAddBtn, onTabsOrderChange }) {
    const tabContainerRef = useRef(null);
    const [dummy, setDummy] = useState(0); // for rendering whenever tab length changes so that view gets updated

    useEffect(() => {
        // do an extra render when
        // 1. A new tab is added so that it gets reflected in tab list
        setDummy(dummy + 1);
    }, [tabs, tabs.length]);

    useEffect(() => {
        const activeTabElement = tabContainerRef.current.querySelector(`#tab-${activeTabId}`);
        if (activeTabElement) {
            const isWithinView = (activeTabElement.offsetLeft >= tabContainerRef.current.scrollLeft) && (activeTabElement.offsetLeft - tabContainerRef.current.scrollLeft < tabContainerRef.current.offsetWidth);
            if (!isWithinView) {
                const scrollElement = tabContainerRef.current;
                const currentScrollPos = scrollElement.scrollLeft;
                const finalScrollPos = activeTabElement.offsetLeft ;
                const scrollSpeed = finalScrollPos > currentScrollPos ? 40 : -40;

                const scroll = () => {
                    if ((scrollSpeed > 0 && scrollElement.scrollLeft <= finalScrollPos) || (scrollSpeed < 0 && scrollElement.scrollLeft >= finalScrollPos)) {
                        const currentScrollLeft = scrollElement.scrollLeft;
                        scrollElement.scrollLeft = scrollElement.scrollLeft + scrollSpeed;
                        const noMoreScrollPossible = currentScrollLeft === scrollElement.scrollLeft;
                        if (!noMoreScrollPossible) {
                            requestAnimationFrame(scroll);
                        } else {
                            setDummy(dummy + 1);
                        }
                    }
                };
                requestAnimationFrame(scroll);
            }
        }
    }, [activeTabId, tabs]);



    const handleSlideLeftBtnClick = () => scrollSmoothly('left');
    const handleSlideRightBtnClick = () => scrollSmoothly('right');
    const scrollSmoothly = (direction) => {
        const scrollElement = tabContainerRef.current;
        const scrollAmount = scrollElement ? Math.max(100, (scrollElement.scrollWidth - scrollElement.offsetWidth) / 4) : 0;
        const finalScrollPos = direction === 'right' ? Math.min(scrollElement.scrollLeft + scrollAmount, scrollElement.scrollWidth - scrollElement.offsetWidth) : Math.max(scrollElement.scrollLeft - scrollAmount, 0);
        const currentScrollPos = scrollElement.scrollLeft;
        const scrollSpeed = finalScrollPos > currentScrollPos ? scrollAmount / 20 : -scrollAmount / 20; // speed in pixels/ms

        const scroll = () => {
            if ((scrollSpeed > 0 && scrollElement.scrollLeft <= finalScrollPos) || (scrollSpeed < 0 && scrollElement.scrollLeft >= finalScrollPos)) {
                const currentScrollLeft = scrollElement.scrollLeft;
                scrollElement.scrollLeft = scrollElement.scrollLeft + scrollSpeed;
                const noMoreScrollPossible = currentScrollLeft === scrollElement.scrollLeft;
                if (!noMoreScrollPossible) {
                    requestAnimationFrame(scroll);
                } else {
                    setDummy(dummy + 1);
                }
            }
        };
        requestAnimationFrame(scroll);
    }

    const showSlideBtns = tabContainerRef.current ? tabContainerRef.current.scrollWidth > tabContainerRef.current.offsetWidth : false;
    const showLeftSlideBtn = showSlideBtns && tabContainerRef.current.scrollLeft > 0;
    const showRightSlideBtn = showSlideBtns && tabContainerRef.current.scrollLeft < tabContainerRef.current.scrollWidth - tabContainerRef.current.offsetWidth;


    const handleMouseWheel = (e) => {
        e.stopPropagation();
        tabContainerRef.current.scrollLeft = tabContainerRef.current.scrollLeft + e.deltaY + e.deltaX;
        setDummy(dummy + 1);
    }

    const handleModeChangeBtnClick = (tab, isInEditmode) => {
        // check if user has privilege of Editing the dashboard or not
        if (!tab.privileges.includes('EDIT')) {
            alertService.showToast('error', 'You don\'t have privilege to edit the dashboard');
            return;
        }
        if (isInEditmode) {
            onPublish(tab.id);
        } else {
            onEdit(tab.id);
            // also open the plotterPanel in Edit mode if not opened already
            if (!tab.showPlotterPanel) { onPanelToggle(tab.id, 'showPlotterPanel') }
        }
    };

    const onDragEnd = (result) => {
        // dropped outside the list
        if (!result.destination) return;
        if (result.destination.index === 0) return;

        let updatedTabs = reorder(tabs, result.source.index, result.destination.index);
        onTabsOrderChange(updatedTabs);
    }

    return (
        <div className={'sub-header-tabs-container'}>

            {/* First tab is always home tab */}
            {[tabs[0]].map((tab) => {
                const isSelected = String(tab.id) === activeTabId;
                const isEditMode = tab.editMode;

                return (
                    <div key="home-tab" className={'tab-home-fixed' + (isSelected ? ' selected' : '')}>
                        <div className={'tab-inner'} onClick={() => onOpen(tab.id, isEditMode)}>
                            <span className="tab-title"> <i></i><span>Home</span></span>
                        </div>
                    </div>
                )
            })}

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="droppable" direction="horizontal">
                    {(provided) => {
                        return (
                            <div className="sub-header-tabs-droppable" ref={provided.innerRef} {...provided.droppableProps} >
                                <div className={'sub-header-tabs' + (showSlideBtns ? ' h-scroll' : '')} ref={tabContainerRef} onWheel={handleMouseWheel}  >
                                    {tabs.map((tab, index) => {
                                        if (tab.id === 'home') return null;
                                        const isSelected = String(tab.id) === activeTabId;
                                        const isEditMode = tab.editMode;
                                        const isNewTab = String(tab.id).includes('new');

                                        const canSwitchToEditMode = !isNewTab && tab.privileges.includes('EDIT');
                                        // console.log('rendering tab : ', tab.id);
                                        return (
                                            <Draggable key={tab.id + '_' + index} draggableId={tab.id + '_' + index} index={index}>
                                                {(provided) => (
                                                    <div className={'tab' + (isSelected ? ' selected' : '')}
                                                        id={`tab-${tab.id}`}
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => onOpen(tab.id, isEditMode)}>
                                                        <div className={'tab-inner'}>
                                                            <span className="tab-title">{tab.dashboard_name || tab.name}</span>
                                                            {isSelected &&
                                                                <div className={'tab-selection'}>
                                                                    {!isNewTab &&
                                                                        <span className={'tab-mode ' + (isEditMode ? 'edit-mode' : 'view-mode') + (!canSwitchToEditMode ? ' disabled' : '')}
                                                                            title={!canSwitchToEditMode ? 'You don\'t have privilege to edit the dashboard' : `Switch to ${isEditMode ? 'Viewing' : 'Editing'}`}
                                                                            onClick={(e) => { e.stopPropagation(); handleModeChangeBtnClick(tab, isEditMode) }}>
                                                                            {isEditMode ? 'Editing' : 'Viewing'}
                                                                        </span>
                                                                    }
                                                                </div>
                                                            }
                                                            {isSelected && <span className="tab-close" onClick={(e) => { e.stopPropagation(); onRemove(tab.id) }}></span>}
                                                            {!isSelected && <span className="tab-close hover-visible" onClick={(e) => { e.stopPropagation(); onRemove(tab.id) }}></span>}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        )
                                    })}

                                    {provided.placeholder}
                                    {showLeftSlideBtn && <button className="slide-tab-btn slide-tab-left" onClick={handleSlideLeftBtnClick}></button>}
                                    {showRightSlideBtn && <button className="slide-tab-btn slide-tab-right" onClick={handleSlideRightBtnClick}></button>}
                                </div>
                            </div>
                        )
                    }}
                </Droppable>
            </DragDropContext>

            <div className="add-dash-btn-wrapper">
                <button className="btn btn-link btn-newanalysis" onClick={onTabAddBtn}></button>
            </div>

        </div>
    );
}