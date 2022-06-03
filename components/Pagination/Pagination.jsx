import React from 'react';
import './Pagination.scss';
import SpeedSelect from '../SpeedSelect/SpeedSelect';

export default class Pagination extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            totalRecords: this.props.totalRecords,
            totalPages: Math.ceil(this.props.totalRecords/this.props.pageSizeSelected),
            pageSizes: this.props.pageSizes,
            pageSizeSelected: this.props.pageSizeSelected,
            currentPage: this.props.currentPage,
        }

        this.onOptionSelect = this.onOptionSelect.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.pageSizeSelected!==this.props.pageSizeSelected || 
            prevProps.totalRecords!==this.props.totalRecords ||
            prevProps.currentPage!==this.props.currentPage
        ) {
            this.setState({
                totalRecords: this.props.totalRecords,
                totalPages: Math.ceil(this.props.totalRecords/this.props.pageSizeSelected),
                pageSizes: this.props.pageSizes,
                pageSizeSelected: this.props.pageSizeSelected,
                currentPage: this.props.currentPage,
            });
        }
    }

    //On Select Change
    onOptionSelect(event, id){
        this.setState({pageSizeSelected: event});

        //Get Parent Method Call
        this.props.onPageChange({'pageSizeSelected': event});
    }


    //Handle Page Change
    handlePageChange(e, type){
        let obj = {};
        if(type==='input'){
            obj['currentPage'] = e.target.value;
        } else if(type==='prev'){
            obj['currentPage'] = (this.state.currentPage-1);
        } else if(type==='next'){
            obj['currentPage'] = (this.state.currentPage+1);
        }
        if(obj['currentPage'] < 1 || obj['currentPage'] > this.state.totalPages) return false;
        this.setState(obj);

        //Get Parent Method Call
        this.props.onPageChange({'currentPage': obj['currentPage']});
    }


    render() {
        let start = (this.state.pageSizeSelected*(this.state.currentPage-1)+1);
        let end = (this.state.pageSizeSelected*this.state.currentPage > this.state.totalRecords ? this.state.totalRecords : (this.state.pageSizeSelected*this.state.currentPage));
        let isNextDisabled = (end >= this.state.totalRecords) ? true : false;
        let isPrevDisabled = (start <= 1) ? true : false;

        return (
            <div className="pagination-wrapper">
                <div className="records-info">Records: {start}-{end}/{(this.state.totalRecords)}</div>
                <div className="records-per-page">
                    {this.state.totalRecords > 0 && 
                        <SpeedSelect
                            options={this.state.pageSizes} // required
                            selectedOption={(this.state.pageSizeSelected) ? this.state.pageSizeSelected : ''} // required
                            onSelect={(e) => this.onOptionSelect(e, 'pagination')} 
                            displayKey='name'
                            uniqueKey='id'
                            selectLabel='Pages' 
                            maxHeight={120}
                        />
                    }
                </div>
                <div className="pagination">
                    <input type="text" name="page-no" id="page-no" className="input-field" value={this.state.currentPage} onChange={(e) => this.handlePageChange(e, 'input')} />
                    <div className="total-pages"> / {this.state.totalPages}</div>
                    <div className="controls">
                    <button className="btn-prev" onClick={(e) => this.handlePageChange(e, 'prev')} disabled={isPrevDisabled}>Prev</button>
                    <button className="btn-next" onClick={(e) => this.handlePageChange(e, 'next')} disabled={isNextDisabled}>Next</button>
                    </div>
                </div>
            </div>
        )
    }
}
