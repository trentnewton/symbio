<header class="major-header"><h2><?php print render($content['field_category']); ?></h2></header>
<ul class="medium-block-grid-2">
  <li>
    <div class="row">
      <div class="medium-6 columns">
        <h3><?php print $title; ?></h3>
        <h5 class="subheader"><?php print render($content['field_sub_title']); ?></h5>
        <p><?php print render($content['body']); ?></p>
      </div>
      <div class="medium-6 columns">
        <figure>
          <?php print render($content['field_product_image']); ?>
        </figure>
      </div>
    </div>
    <div class="row">
      <div class="column">
        <hr>
      </div>
    </div>
  </li>
</ul>