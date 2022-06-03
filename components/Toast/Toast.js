import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import './Toast.scss';
import alertService from "../../services/alertService";

const TOAST_HEIGHT = 30;
const TOAST_BOTTOM = 30;
const TOAST_TIMEOUT = 3000;

export default class Toast extends React.Component {
  constructor() {
    super();
    this.state = {
      toasts: []
    }
    this.subscriptionShow = null;
  }

  componentDidMount() {
    // Subscribe toastShow
    this.subscriptionShow = alertService.onToastShow().subscribe(toast => {
      this.setState({
        toasts: [...this.state.toasts, toast]
      });

      if (toast.autoClose) {
        setTimeout(() => {
          this.remove(toast.id);
        }, TOAST_TIMEOUT);
      }
    });

    // Subscribe toastHide
    this.subscriptionHide = alertService.onToastHide().subscribe(({ id }) => {
      this.remove(id);
    });

  }

  componentWillUnmount() {
    this.subscriptionShow.unsubscribe();
    this.subscriptionHide.unsubscribe();
  }

  remove(id) {
    this.setState({
      toasts: this.state.toasts.filter(t => t.id !== id)
    });
  }

  render() {
    return (
      <AnimatePresence>
        {this.state.toasts.map((toast, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: "100vh" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100vh" }}
            transition={{ type: "linear" }}
            id={'toast-' + toast.id}
            className={'toast-wrapper ' + toast.type}
            onClick={() => this.remove(toast.id)}
            style={{
              height: `${TOAST_HEIGHT}px`,
              bottom: `${TOAST_BOTTOM + (index * TOAST_HEIGHT) + (index * 10)}px`
            }}
          >
            <div className="toast-icon"> </div>
            <div>{toast.message}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    );
  }
}
