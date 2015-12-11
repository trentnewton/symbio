<div class="off-canvas-wrap docs-wrap" data-offcanvas="">
  <div class="inner-wrap">
    <main id="main-wrapper">
      <?php include ($directory."/partials/header.php"); ?>
    <?php if(!drupal_is_front_page()):?>
      <section id="masthead" role="banner">
        <div class="row">
          <div class="column">
            <?php if ($page['masthead']): ?>
            <div class="page-title" data-sr="enter bottom">
              <?php print render($page['masthead']); ?>
            </div>
            <?php endif; ?>
            <nav class="tab-links" data-sr="enter bottom wait 0.5s">
              <a href="#first-section"><?php print render( $node->field_about_first_section_title["und"][0]["value"] ); ?></a>
              <a href="#second-section"><?php print render( $node->field_about_second_section_title["und"][0]["value"] ); ?></a>
              <a href="#third-section"><?php print render( $node->field_about_third_section_title["und"][0]["value"] ); ?></a>
            </nav>
          </div>
        </div>
      </section>
      <?php if ($page['search']): ?>
      <section id="search-box">
        <?php print render($page['search']); ?>
      </section>
      <?php endif; ?>
      <?php if ($messages || $tabs) : ?>
      <div class="row">
        <div class="column">
          <?php print $messages; ?>
          <div class="tabs">
            <?php print render($tabs); ?>
          </div>
        </div>
      </div>
      <?php endif; ?>
      <?php if ($page['content']): ?>
      <div class="about-page-container" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
        <div class="row">
          <div class="column">
            <?php print render($page['content']); ?>
          </div>
        </div>
      </div>
      <?php endif; ?>
    <?php endif;?>
    </main>
    <?php include ($directory."/partials/footer.php"); ?>
    <a class="exit-off-canvas"></a>
  </div>
</div>