import React, { Component } from 'react';

import '../plugins/modal';

export default class WantedMails extends Component {
  render() {
    return (
      <div id={this.props.brand} className="div_wanted-mails">
        <span>
          <button className="btn__activity btn-noStyle" type="button" data-toggle="modal" data-target="#exampleModalCenter">
            <img src={this.props.logo} width="140" height="140"/>
          </button>
          <div className="modal fade" id="exampleModalCenter" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content content_size">
                <div className="modal-header">
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body content_center">
                  <img src={this.props.ad} width="350" height="500"/>
                </div>
              </div>
            </div>
          </div>
        </span>
        <p className="p-wanted-mails">
          <input type="checkbox" name={this.props.brand} 
          onClick={this.props.trigger}/>
          {this.props.brand}
        </p>
      </div>
    );
  }
}