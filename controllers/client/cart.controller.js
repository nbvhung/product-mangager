const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");

const productHelper = require("../../helpers/products");

// [GET] /cart/
module.exports.index = async (req, res) => {
    const cartId = req.cookies.cartId;

    const cart = await Cart.findOne({
        _id: cartId
    })

    if(cart.products.length > 0){
        for (const item of cart.products) {
            const productId = item.product_id;
            const productInfo = await Product.findOne({
                _id: productId
            });

            productInfo.priceNew = productHelper.priceNewProduct(productInfo); // lay ra gia moi

            item.productInfo = productInfo; // tham thuoc tinh san pham

            item.totalPrice = productInfo.priceNew * item.quantity; // tong tien của tung san pham
        }
    }

    cart.totalPrice = cart.products.reduce((sum, item) => sum + item.totalPrice, 0);

    res.render("client/pages/cart/index", {
        pageTitle: "Giỏ hàng",
        cartDetail: cart
    });
}


// [POST] /cart/add/:productId
module.exports.addPost = async (req, res) => {
    const cartId = req.cookies.cartId;
    const productId = req.params.productId;
    const quantity = parseInt(req.body.quantity);

    const cart = await Cart.findOne({
        _id: cartId
    });

    const existProductInCart = cart.products.find(item => item.product_id == productId);// tìm kiếm trong mang products
    if(existProductInCart){ // nếu đã tồn tại sản phẩm thì tăng quantity
        const newQuantity = quantity + existProductInCart.quantity;

        await Cart.updateOne(
            {
                _id: cartId,
                'products.product_id': productId, // cap nhat id san pham
            },
            {
                'products.$.quantity': newQuantity // cap nhat so luowng
            }
        );
    }
    else{
        const objectCart = {
            product_id: productId,
            quantity: quantity
        }
    
        await Cart.updateOne(
            {
                 _id: cartId
            }, // tim gio hang
            {
                $push: { products: objectCart} 
            }
        );
    }
    req.flash("success", "Thêm sản phẩm vào giỏ hàng thành công!");
    
    res.redirect("back");
}


// [GET] /cart/delete/:id 
module.exports.delete = async (req, res) => {
    const cartId = req.cookies.cartId;
    const productId = req.params.productId;

    await Cart.updateOne(
        {
            _id: cartId
        },
        {
            "$pull": { products: { "product_id": productId}}
        } // đẩy sản phẩm đã xóa ra khỏi mảng
    )

    req.flash("success", "Đã xóa sản phẩm khỏi giỏ hàng!");

    res.redirect("back");
}


// [GET] /cart/update/:productId/:quantity 
module.exports.update = async (req, res) => {
    const cartId = req.cookies.cartId;
    const productId = req.params.productId;
    const quantity = req.params.quantity;

    await Cart.updateOne(
        {
            _id: cartId,
            'products.product_id': productId, // cap nhat id san pham
        }, // tim noi update
        {
            'products.$.quantity': quantity // cap nhat so luowng
        } // gia tri can update
    );

    req.flash("success", "Đã cập nhật số lượng!");

    res.redirect("back");
}