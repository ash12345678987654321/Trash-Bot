import mnist_loader
import network

training_data, validation_data, test_data = mnist_loader.load_data_wrapper()
net=network.Network([784,400,100,30,10])
net.SGD(training_data, 500, 10, 1.0, test_data=test_data)
