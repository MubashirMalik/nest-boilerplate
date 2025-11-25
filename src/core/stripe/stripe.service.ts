import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
    constructor (
        @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
        private readonly configService: ConfigService,
    ) {}

    async getStripeCustomer(customerId: string): Promise<Stripe.Customer> {
        const customer = await this.stripe.customers.retrieve(customerId);

        if (customer.deleted) {
            throw new BadRequestException('Customer has been deleted');
        }
        return customer as Stripe.Customer;
    }

    async createCheckoutSession() {
        /*
        const subscriptionPlan = await this.subscriptionPlanRepo.findOne({ where: { name: planName } });
        if (!subscriptionPlan) {
            throw new Error('Subscription plan not found');
        }

        let customer: Stripe.Customer;
        if (!user.stripeCustomerId) {
            const newCustomer = await this.stripe.customers.create({
                email: user.email,
            });
            customer = newCustomer;
            user.stripeCustomerId = customer.id;
            await user.save()
        } else {
            customer = await this.getStripeCustomer(user.stripeCustomerId);
        }

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        const session = await this.stripe.checkout.sessions.create({
            customer: customer.id,
            line_items: [
                {
                    price: subscriptionPlan.priceId,
                    quantity: quantity,
                },
            ],
            mode: 'subscription',
            success_url: `${STRIPE_SUCCESS_URL}`,
            cancel_url: `${STRIPE_CANCEL_URL}`,
        });

        const invoice = await this.invoiceService.createInitialInvoice(
            user.id, 
            subscriptionPlan, 
            quantity,  
            session.id,
            orderId
        );

        return { session, invoice };
        */
    }
}