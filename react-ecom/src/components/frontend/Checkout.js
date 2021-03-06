import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useHistory } from "react-router";
import axios from "axios";
import swal from "sweetalert";

const Checkout = () => {
  const history = useHistory();

  if (!localStorage.getItem("auth_token")) {
    history.push("/");
    swal("Warning", "Login to go to Cart Page", "error");
  }

  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  let totalCartPrice = 0;

  const [checkoutInput, setCheckoutInput] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
  });

  const [error, setError] = useState([]);

  useEffect(() => {
    let isMounted = true;

    axios.get(`/api/cart`).then((res) => {
      if (isMounted) {
        if (res.data.status === 200) {
          setCart(res.data.cart);
          setLoading(false);
        } else if (res.data.status === 401) {
          history.push("/");
          swal("Warning", res.data.message, "error");
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [history]);

  const handleInput = (e) => {
    e.persist();
    setCheckoutInput({ ...checkoutInput, [e.target.name]: e.target.value });
  };

  const orderinfo_data = {
    firstname: checkoutInput.firstname,
    lastname: checkoutInput.lastname,
    phone: checkoutInput.phone,
    email: checkoutInput.email,
    address: checkoutInput.address,
    city: checkoutInput.city,
    state: checkoutInput.state,
    zipcode: checkoutInput.zipcode,
    payment_mode: "Paid by Paypal",
    payment_id: "",
  };

  // Paypal Code - start
  const PayPalButton = window.paypal.Buttons.driver("react", {
    React,
    ReactDOM,
  });

  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            // value: "0.1",
            value: totalCartPrice,
          },
        },
      ],
    });
  };
  // sb-i47atb8712684@business.example.com

  // zFx,7,$z

  const onApprove = (data, actions) => {
    // return actions.order.capture();
    return actions.order.capture().then(function (details) {
      orderinfo_data.payment_id = details.id;
      axios.post(`/api/place-order`, orderinfo_data).then((res) => {
        if (res.data.status === 200) {
          swal("Order Placed Successfully", res.data.message, "success");
          setError([]);
          history.push("/thank-you");
        } else if (res.data.status === 422) {
          swal("All fields are mandatory", "", "error");
          setError(res.data.errors);
        }
      });
    });
  };
  // Paypal Code - end

  const sumbitOrder = (e, payment_mode) => {
    e.preventDefault();

    const data = {
      firstname: checkoutInput.firstname,
      lastname: checkoutInput.lastname,
      phone: checkoutInput.phone,
      email: checkoutInput.email,
      address: checkoutInput.address,
      city: checkoutInput.city,
      state: checkoutInput.state,
      zipcode: checkoutInput.zipcode,
      payment_mode: payment_mode,
      payment_id: "",
    };

    switch (payment_mode) {
      case "cod":
        axios.post(`/api/place-order`, data).then((res) => {
          if (res.data.status === 200) {
            swal("Order Placed Successfully", res.data.message, "success");
            setError([]);
            history.push("/thank-you");
          } else if (res.data.status === 422) {
            swal("All fields are mandatory", "", "error");
            setError(res.data.errors);
          }
        });
        break;
      case "razorpay":
        axios.post(`/api/validate-order`, data).then((res) => {
          if (res.data.status === 200) {
            setError([]);
            var options = {
              key: "rzp_test_gjYxIMMiFByRDl",
              amount: totalCartPrice * 100,
              name: "PascalEcom",
              description: "Thank you for purchasing with PascalEcom",
              image: "https://example.com/your_logo",
              handler: function (response) {
                console.log(response.razorpay_payment_id);
                data.payment_id = response.razorpay_payment_id;
                axios.post(`/api/place-order`, data).then((res) => {
                  if (res.data.status === 200) {
                    swal(
                      "Order Placed Successfully",
                      res.data.message,
                      "success"
                    );
                    setError([]);
                    history.push("/thank-you");
                  }
                });
              },
              prefill: {
                name: data.firstname + data.lastname,
                email: data.email,
                contact: data.phone,
              },
              theme: {
                color: "#3399cc",
              },
            };
            var rzp1 = new window.Razorpay(options);
            rzp1.open();
          } else if (res.data.status === 422) {
            swal("Error", res.data.message, "error");
            setError(res.data.errors);
          }
        });
        break;
      case "payonline":
        axios.post(`/api/place-order`, data).then((res) => {
          if (res.data.status === 200) {
            setError([]);
            var myModal = new window.bootstrap.Modal(
              document.getElementById("payOnlineModal")
            );
            myModal.show();
          } else if (res.data.status === 422) {
            swal("All fields are mandatory", "", "error");
            setError(res.data.errors);
          }
        });

        break;
      default:
        break;
    }
  };

  // key_id =>       rzp_test_gjYxIMMiFByRDl
  // key_secret =>   b26i0KDDqZQE5iwaVLks5KjF

  if (loading) {
    return <h4>Loading...</h4>;
  }

  let checkout_HTML = "";
  if (cart.length > 0) {
    checkout_HTML = (
      <div>
        <div className="row">
          <div className="col-md-7">
            <div className="card">
              <div className="card-header">
                <h4>Basic Information</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label>First Name</label>
                      <input
                        type="text"
                        name="firstname"
                        onChange={handleInput}
                        value={checkoutInput.firstname}
                        className="form-control"
                      />
                      <small className="text-danger">{error.firstname}</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label>Last Name</label>
                      <input
                        type="text"
                        name="lastname"
                        onChange={handleInput}
                        value={checkoutInput.lastname}
                        className="form-control"
                      />
                      <small className="text-danger">{error.lastname}</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        onChange={handleInput}
                        value={checkoutInput.phone}
                        className="form-control"
                      />
                      <small className="text-danger">{error.phone}</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label>Email</label>
                      <input
                        type="text"
                        name="email"
                        onChange={handleInput}
                        value={checkoutInput.email}
                        className="form-control"
                      />
                      <small className="text-danger">{error.email}</small>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-group mb-3">
                      <label>Full Address</label>
                      <textarea
                        rows="3"
                        name="address"
                        onChange={handleInput}
                        value={checkoutInput.address}
                        className="form-control"
                      ></textarea>
                      <small className="text-danger">{error.address}</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        onChange={handleInput}
                        value={checkoutInput.city}
                        className="form-control"
                      />
                      <small className="text-danger">{error.city}</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label>State</label>
                      <input
                        type="text"
                        name="state"
                        onChange={handleInput}
                        value={checkoutInput.state}
                        className="form-control"
                      />
                      <small className="text-danger">{error.state}</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label>Zip Code</label>
                      <input
                        type="text"
                        name="zipcode"
                        onChange={handleInput}
                        value={checkoutInput.zipcode}
                        className="form-control"
                      />
                      <small className="text-danger">{error.zipcode}</small>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-group text-end">
                      <button
                        type="button"
                        onClick={(e) => sumbitOrder(e, "cod")}
                        className="btn btn-primary ms-1"
                      >
                        Place Order
                      </button>
                      <button
                        type="button"
                        onClick={(e) => sumbitOrder(e, "razorpay")}
                        className="btn btn-primary ms-1"
                      >
                        Pay by Razorpay
                      </button>
                      <button
                        type="button"
                        onClick={(e) => sumbitOrder(e, "payonline")}
                        className="btn btn-warning ms-1"
                      >
                        Pay Online
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th width="50%">Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => {
                  totalCartPrice +=
                    item.product.selling_price * item.product_qty;
                  return (
                    <tr key={idx}>
                      <td>{item.product.name}</td>
                      <td>{item.product.selling_price}</td>
                      <td>{item.product.product_qty}</td>
                      <td>{item.product.selling_price * item.product_qty}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan="2" className="text-end fw-bold">
                    Grand Total
                  </td>
                  <td colSpan="2" className="text-end fw-bold">
                    {totalCartPrice}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } else {
    checkout_HTML = (
      <div>
        <div className="card card-body py-5 text-center shadow-sm">
          <h4>Your Shopping Cart is Empty. You are in Checkout Page.</h4>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="modal fade"
        id="payOnlineModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Online Payment Mode
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <hr />
              <PayPalButton
                createOrder={(data, actions) => createOrder(data, actions)}
                onApprove={(data, actions) => onApprove(data, actions)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="py-3 bg-warning">
        <div className="container">
          <h6>Home / Checkout</h6>
        </div>
      </div>
      <div className="py-4">
        <div className="container">{checkout_HTML}</div>
      </div>
    </div>
  );
};

export default Checkout;
